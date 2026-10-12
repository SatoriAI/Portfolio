import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { MARKED } from "@/components/experience/circleStyles";
import { projectIcons } from "@/config/projectIcons";
import { useOnceInView } from "@/hooks/use-in-view";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/use-media-query";
import {
  expired,
  fitCanvas,
  heatAt,
  type HeatModel,
  type HeatSource,
  paintField,
} from "@/lib/heatKernel";
import {
  arrivingPucks,
  type Direction,
  type FieldLayout,
  fieldLayout,
  glideHome,
  land,
  moveToSlot,
  nearestSlot,
  neighbour,
  type Point,
  type Puck,
  pushFrom,
  restingPuck,
  settled,
  stepPucks,
  waiting,
} from "@/lib/projectField";
import type { UiProject } from "@/lib/projectsService";
import { cn } from "@/lib/utils";

/**
 * The projects as pucks on a heat field: the menu bar's heat kernel
 * (lib/heatKernel), given room to play.
 *
 * Every project is a white round puck with its icon, its name under it, at a
 * home of its own (lib/projectField), on the section's own white: the field
 * has no colour until there is heat, and all its heat is lavender. The first time the field is well in
 * view one pulse of heat spreads from its centre and the pucks burst out from
 * it to their homes; after that nothing moves on its own. The reader is the
 * only heat: a mouse moving over the field leaves kernels that spread and
 * fade, as over the menu bar, and the pucks lean a few pixels toward the
 * warmth and spring back; under the field one line says how to choose. A
 * click on the empty field sends a pulse that nudges the pucks near it; a
 * puck can be dragged, lifted over the others, and where it is let go it
 * stays: it takes the home nearest it and the others move along to make
 * room, for this visit, each gliding straight to its new home.
 * Choosing one gives it an iris rim inside the site's lavender ring and a
 * short warm flood, under 300 ms, and the panel below shows it.
 *
 * The pucks are the tabs of the panels below (see ProjectIndex): Tab reaches
 * the field, the arrows move to the nearest puck that way, and Enter opens.
 * The loop runs only while the field is on screen, the page is visible and
 * something is still moving or warm. Under reduced motion, and on a phone
 * with many projects, the pucks stand in a plain grid on a still field and
 * hover and focus only change the ring.
 */

export type ProjectFieldLabels = {
  /** Accessible name of the field's list of projects. */
  field: string;
  /** The line under the field, saying how to choose, where a mouse can play. */
  hint: string;
  /** The same, on touch. */
  hintTouch: string;
  /** The same, on the still grid, where nothing can be dragged. */
  hintStill: string;
};

type ProjectFieldProps = {
  projects: readonly UiProject[];
  /** The open project's title. */
  selected: string;
  onOpen: (title: string) => void;
  labels: ProjectFieldLabels;
};

/** The field at rest is the section's own white; heat tints it lavender. */
const WHITE = [255, 255, 255] as const;

/** The kinds of heat, each a kernel model in pixels and seconds, born `radius` wide. */
const model = (peak: number, scale: number, radius: number, lifetime: number): HeatModel => ({
  peak,
  scale,
  diffusivity: radius ** 2 / (4 * scale),
  lifetime,
});
const KINDS = {
  /**
   * Left by a moving mouse, or by focus: the menu bar's heat at a puck's
   * size, but twice as strong. On white it is the field's only colour, and
   * no text is set on it (the names sit on their own white pills), so it
   * need not stay as faint as the bar's.
   */
  pointer: { model: model(0.55, 0.12, 44, 1.6), pulls: true },
  /** A click on the empty field. */
  pulse: { model: model(0.7, 0.08, 60, 1.4), pulls: true },
  /** The one arrival, from the centre, filling the field over 2.4 s. */
  arrival: { model: model(0.55, 0.1, 120, 2.4), pulls: false },
  /** Opening a project: a short warm flood from its puck. */
  flood: { model: model(0.5, 0.03, 115, 0.3), pulls: false },
} as const;
type Kind = keyof typeof KINDS;
const KIND_NAMES = Object.keys(KINDS) as Kind[];

/** Pointer heat is laid at most this often along a path, and this much of it is kept. */
const POINTER_SPACING = 16;
const POINTER_MAX = 64;
/** A press that travels this far is a drag, not a click. */
const DRAG_THRESHOLD = 6;
/** The field's grid: 96 columns, as HeatField's. */
const COLS = 96;
/** Clear under each puck for its name. */
const NAME_ROOM = 30;

/**
 * The field's clock, in seconds of wall time: heat left while the loop is
 * paused (off screen, a hidden tab) has aged by the time it is drawn, rather
 * than playing back when the field returns.
 */
const wallClock = () => performance.now() / 1000;

type Sim = {
  layout: FieldLayout;
  pucks: Puck[];
  clock: number;
  sources: Record<Kind, HeatSource[]>;
  /** Rows of the field's grid, for its aspect. */
  rows: number;
  hovered: number;
  focused: number;
  lastPointer: Point | null;
  /** Whether the arrival has begun (or was never to be played). */
  arrived: boolean;
  visible: boolean;
  frame: number | null;
  last: number | null;
};

type Gesture = { index: number; id: number; start: Point; offset: Point; moved: boolean };

const noSources = (): Record<Kind, HeatSource[]> => ({
  pointer: [],
  pulse: [],
  arrival: [],
  flood: [],
});

/** The field's grid: 96 columns, and rows for its aspect. */
const rowsFor = (layout: FieldLayout) => {
  const aspect = layout.width > 0 ? layout.height / layout.width : 0.5;
  return Math.max(16, Math.min(160, Math.round(COLS * aspect)));
};

/** The icon on a white face, or the initial where a project has none. */
const PuckFace = ({ project }: { project: UiProject }) => {
  const icon = projectIcons[project.title] ?? project.image;
  return icon ? (
    <img
      src={icon}
      alt=""
      draggable={false}
      className="pointer-events-none size-[64%] object-contain"
    />
  ) : (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="size-[64%]">
      <text
        x="50"
        y="50"
        dy="0.35em"
        textAnchor="middle"
        fontSize="56"
        fontWeight="700"
        className="fill-iris"
      >
        {project.title.charAt(0)}
      </text>
    </svg>
  );
};

/** A faint ring under a real pointer, as on the company circles. */
const HOVER_RING =
  "[@media(hover:hover)]:group-hover:outline [@media(hover:hover)]:group-hover:outline-2 [@media(hover:hover)]:group-hover:outline-offset-[3px] [@media(hover:hover)]:group-hover:outline-iris/40";

/** A mask fading an element out over `x` pixels at its sides and `y` at its top and bottom. */
const fadeMask = (x: number, y: number): CSSProperties => {
  const image = `linear-gradient(to right, transparent, #000 ${x}px, #000 calc(100% - ${x}px), transparent), linear-gradient(to bottom, transparent, #000 ${y}px, #000 calc(100% - ${y}px), transparent)`;
  return {
    maskImage: image,
    WebkitMaskImage: image,
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  };
};

const ARROWS: Record<string, Direction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

const ProjectField = ({ projects, selected, onOpen, labels }: ProjectFieldProps) => {
  const reducedMotion = usePrefersReducedMotion();
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const fieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const puckRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const faceRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const roomRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const swallowClick = useRef(-1);
  const sim = useRef<Sim | null>(null);

  const [width, setWidth] = useState(0);
  const layout = useMemo(
    () => fieldLayout(projects.length, width, reducedMotion),
    [projects.length, width, reducedMotion],
  );
  /**
   * The reader's own order: the home of each puck, by index into the
   * layout's homes. A puck dropped on the field takes the home nearest it
   * and the others move along (see moveToSlot). For this visit only: every
   * reader first sees the order set in the admin.
   */
  const [ownOrder, setOwnOrder] = useState<number[]>([]);
  const order = useMemo(
    () => (ownOrder.length === projects.length ? ownOrder : projects.map((_, i) => i)),
    [ownOrder, projects],
  );
  const homes = useMemo(() => order.map((slot) => layout.slots[slot]), [order, layout]);

  // The room there is, before the first paint and on every resize; not the
  // field's own width, since a still grid is narrower than the room (see
  // fieldLayout).
  useLayoutEffect(() => {
    const room = roomRef.current;
    if (!room) return;
    setWidth(room.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(room);
    return () => observer.disconnect();
  }, []);

  const paint = () => {
    const s = sim.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!s || !canvas || !ctx) return;
    fitCanvas(canvas, COLS, s.rows);
    const { width: w, height: h } = s.layout;
    const live = KIND_NAMES.filter((kind) => s.sources[kind].length > 0);
    paintField(
      ctx,
      COLS,
      s.rows,
      (u, v, alpha) => {
        for (const kind of live) {
          alpha[0] += heatAt(s.sources[kind], KINDS[kind].model, u * w, v * h, s.clock);
        }
      },
      WHITE,
    );
  };

  /** Each puck's place and shape, written straight to its element. */
  const write = () => {
    const s = sim.current;
    if (!s) return;
    const half = s.layout.size / 2;
    s.pucks.forEach((puck, i) => {
      const element = puckRefs.current[i];
      const face = faceRefs.current[i];
      if (!element || !face) return;
      element.style.transform = `translate3d(${(puck.x - half).toFixed(2)}px, ${(puck.y - half).toFixed(2)}px, 0)`;
      // Waiting to arrive: unseen, and not to be pressed where it cannot be seen.
      const unseen = !s.arrived || waiting(puck, s.clock);
      element.style.opacity = unseen ? "0" : "";
      element.style.pointerEvents = unseen ? "none" : "";
      // In the hand it is lifted over the others, which it passes over.
      element.style.zIndex = puck.drag ? "1" : "";
      // Squashed along its motion, so a pushed or arriving puck reads as soft.
      const stretch = Math.min(0.2, Math.hypot(puck.vx, puck.vy) / 2800);
      const angle = Math.atan2(puck.vy, puck.vx);
      face.style.transform =
        puck.s === 1 && stretch === 0
          ? ""
          : `rotate(${angle}rad) scale(${(puck.s * (1 + stretch)).toFixed(4)}, ${(puck.s / (1 + stretch)).toFixed(4)}) rotate(${-angle}rad)`;
    });
  };

  const busy = (s: Sim) =>
    KIND_NAMES.some((kind) => s.sources[kind].length > 0) ||
    !settled(s.pucks, s.hovered >= 0 ? s.hovered : s.focused);

  const frame = (now: number) => {
    const s = sim.current;
    if (!s) return;
    s.frame = null;
    // Physics steps at most 1/30 s at a time, however long the pause.
    const dt = Math.min(1 / 30, Math.max(1 / 240, (now - (s.last ?? now)) / 1000 || 1 / 60));
    // After a pause (off screen, a hidden tab) pucks still waiting in the
    // arrival keep their stagger instead of all leaving at once.
    const paused = s.last === null ? 0 : (now - s.last) / 1000 - 1 / 30;
    if (paused > 0) {
      for (const puck of s.pucks) if (puck.flight) puck.flight.startAt += paused;
    }
    s.last = now;
    // The same clock the sources are stamped with (see heat).
    s.clock = wallClock();
    for (const kind of KIND_NAMES) {
      s.sources[kind] = s.sources[kind].filter(
        (source) => !expired(source, KINDS[kind].model, s.clock),
      );
    }
    stepPucks(s.pucks, dt, {
      layout: s.layout,
      clock: s.clock,
      pull: KIND_NAMES.filter((kind) => KINDS[kind].pulls).map((kind) => ({
        sources: s.sources[kind],
        model: KINDS[kind].model,
      })),
      lifted: s.hovered >= 0 ? s.hovered : s.focused,
      nameRoom: NAME_ROOM,
    });
    write();
    paint();
    if (busy(s)) schedule();
    else s.last = null;
  };

  const schedule = () => {
    const s = sim.current;
    if (!s || s.layout.still || s.frame !== null || !s.visible || document.hidden) return;
    s.frame = requestAnimationFrame(frame);
  };

  const heat = (kind: Kind, at: Point) => {
    const s = sim.current;
    if (!s || s.layout.still) return;
    const list = s.sources[kind];
    list.push({ ...at, bornAt: wallClock() });
    if (list.length > POINTER_MAX) list.shift();
    schedule();
  };

  // A new layout or a new order: the pucks keep their state and move to
  // their new homes; a new number of projects, or a change to or from the still grid,
  // starts them afresh.
  useLayoutEffect(() => {
    if (width === 0) return;
    const s = sim.current;
    const rows = rowsFor(layout);
    if (!s || s.pucks.length !== layout.slots.length || s.layout.still !== layout.still) {
      if (s?.frame != null) cancelAnimationFrame(s.frame);
      sim.current = {
        layout,
        pucks: homes.map(restingPuck),
        clock: wallClock(),
        sources: noSources(),
        rows,
        hovered: -1,
        focused: -1,
        lastPointer: null,
        arrived: layout.still || (s?.arrived ?? false),
        visible: s?.visible ?? false,
        frame: null,
        last: null,
      };
    } else {
      s.layout = layout;
      s.clock = wallClock();
      s.rows = rows;
      homes.forEach((home, i) => {
        const puck = s.pucks[i];
        const moved = Math.hypot(home.x - puck.hx, home.y - puck.hy) > 0.5;
        puck.hx = home.x;
        puck.hy = home.y;
        // A new home (the order changed, or the layout): glide there calmly.
        // An arrival already in flight just heads for the new home.
        if (moved && !puck.drag && puck.flight?.kind !== "arrival") glideHome(puck, wallClock());
      });
      schedule();
    }
    write();
    paint();
    // write, paint and schedule read refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, homes, width]);

  // The arrival, once, the first time the field is well in view.
  const arrive = () => {
    const s = sim.current;
    if (!s || s.arrived) return;
    s.arrived = true;
    s.clock = wallClock();
    s.pucks = arrivingPucks(s.layout, s.clock);
    heat("arrival", { x: s.layout.width / 2, y: s.layout.height / 2 });
    write();
  };
  useOnceInView(fieldRef, arrive, { threshold: 0.3 });

  // Run only while the field is on screen and the page is visible.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const observer = new IntersectionObserver(([entry]) => {
      const s = sim.current;
      if (!s) return;
      s.visible = entry.isIntersecting;
      schedule();
    });
    observer.observe(field);
    const onVisibility = () => schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      const s = sim.current;
      if (s?.frame != null) cancelAnimationFrame(s.frame);
      if (s) {
        s.frame = null;
        s.last = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Opening a project floods warmth from its puck.
  const previous = useRef(selected);
  useEffect(() => {
    if (previous.current === selected) return;
    previous.current = selected;
    const s = sim.current;
    const index = projects.findIndex((project) => project.title === selected);
    if (!s || index < 0 || !s.arrived) return;
    const puck = s.pucks[index];
    heat("flood", { x: puck.x, y: puck.y });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, projects]);

  const local = (event: { clientX: number; clientY: number }): Point => {
    const box = fieldRef.current!.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };

  // A mouse over the field is a moving heat source, as over the menu bar.
  // Touch is left alone: on a phone the same gesture is a scroll.
  const onFieldPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (!s || !s.arrived || event.pointerType === "touch") return;
    const at = local(event);
    if (
      s.lastPointer &&
      Math.hypot(at.x - s.lastPointer.x, at.y - s.lastPointer.y) < POINTER_SPACING
    )
      return;
    s.lastPointer = at;
    heat("pointer", at);
  };

  // A click on the empty field sends a pulse.
  const onFieldClick = (event: MouseEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (!s || !s.arrived || s.layout.still) return;
    if ((event.target as Element).closest('[role="tab"]')) return;
    const at = local(event);
    heat("pulse", at);
    pushFrom(s.pucks, at);
  };

  const puckHandlers = (index: number, title: string) => ({
    onPointerEnter: (event: PointerEvent<HTMLButtonElement>) => {
      const s = sim.current;
      if (!s || event.pointerType === "touch") return;
      s.hovered = index;
      schedule();
    },
    onPointerLeave: () => {
      const s = sim.current;
      if (!s) return;
      if (s.hovered === index) s.hovered = -1;
      s.pucks[index].pressed = false;
      schedule();
    },
    onFocus: (event: FocusEvent<HTMLButtonElement>) => {
      const s = sim.current;
      if (!s) return;
      // Reached by the keyboard before the arrival played: just show them.
      arrive();
      const puck = s.pucks[index];
      // Focus does not wait for its turn in the arrival.
      if (puck.flight) land(puck);
      // Only keyboard focus lifts and warms a puck; the focus a click
      // leaves behind (see onClick) is not the reader pointing at it.
      if (!event.currentTarget.matches(":focus-visible")) return;
      s.focused = index;
      heat("pointer", { x: puck.hx, y: puck.hy });
    },
    onBlur: () => {
      const s = sim.current;
      if (!s) return;
      if (s.focused === index) s.focused = -1;
      schedule();
    },
    // A press must not choose the project at once, as a tab otherwise does:
    // it may be the start of a drag. The click chooses.
    onMouseDown: (event: MouseEvent) => event.preventDefault(),
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      const s = sim.current;
      if (!s) return;
      // A new press: any click left over from an earlier drag is forgotten.
      swallowClick.current = -1;
      s.pucks[index].pressed = true;
      schedule();
      if (s.layout.still || event.pointerType === "touch" || event.button !== 0) return;
      const at = local(event);
      const puck = s.pucks[index];
      gesture.current = {
        index,
        id: event.pointerId,
        start: at,
        offset: { x: puck.x - at.x, y: puck.y - at.y },
        moved: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      const s = sim.current;
      const g = gesture.current;
      if (!s || !g || g.index !== index || g.id !== event.pointerId) return;
      const at = local(event);
      const puck = s.pucks[index];
      if (!g.moved && Math.hypot(at.x - g.start.x, at.y - g.start.y) > DRAG_THRESHOLD) {
        g.moved = true;
        puck.pressed = false;
      }
      if (g.moved) {
        puck.drag = { x: at.x + g.offset.x, y: at.y + g.offset.y };
        schedule();
      }
    },
    onPointerUp: () => endGesture(index),
    onPointerCancel: () => endGesture(index),
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      if (swallowClick.current === index) {
        swallowClick.current = -1;
        return;
      }
      // Pressing does not focus (see onMouseDown), so a pointer's click
      // does: Tab then moves on from the chosen puck. From the keyboard or
      // assistive technology (detail 0) focus is already where it should be.
      if (event.detail > 0) event.currentTarget.focus({ preventScroll: true });
      onOpen(title);
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      const direction = ARROWS[event.key];
      if (!direction) return;
      // Instead of the tab list's own arrows, which only know a line.
      event.preventDefault();
      puckRefs.current[neighbour(homes, index, direction)]?.focus();
    },
  });

  const endGesture = (index: number) => {
    const s = sim.current;
    if (!s) return;
    const puck = s.pucks[index];
    puck.pressed = false;
    const g = gesture.current;
    if (g?.index === index && g.moved) {
      // The click that ends a drag opens nothing.
      swallowClick.current = index;
      // Dropped: it stays, taking the home nearest where it was let go, and
      // the others move along to make room. It glides there, with no throw
      // left in it; the others glide to theirs as their homes change.
      const slot = nearestSlot(s.layout.slots, { x: puck.x, y: puck.y });
      if (slot !== order[index]) setOwnOrder(moveToSlot(order, index, slot));
      glideHome(puck, wallClock());
    }
    puck.drag = null;
    gesture.current = null;
    schedule();
  };

  // No box: the warmth fades into the page at every side, by a fixed width
  // so the pucks at the corners keep warmth under them at any size.
  const phone = layout.width < 640;
  const fade = fadeMask(phone ? 24 : 48, phone ? 32 : 40);

  return (
    // The field has no edge of its own, so its top pad is all the gap the
    // heading above needs: drawn up into the section's usual gap.
    <div ref={roomRef} className="-mt-6 flex flex-col gap-3">
      <div
        ref={fieldRef}
        style={{ height: layout.height, width: layout.width || undefined }}
        onPointerMove={onFieldPointerMove}
        onClick={onFieldClick}
        className="relative isolate max-w-full select-none self-center overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          style={fade}
          className="pointer-events-none absolute inset-0 -z-10 size-full"
        />
        <TabsPrimitive.List aria-label={labels.field} className="absolute inset-0">
          {/* In the reader's order, so Tab and a screen reader follow what
              they see. */}
          {projects
            .map((project, index) => ({ project, index }))
            .sort((a, b) => order[a.index] - order[b.index])
            .map(({ project, index }) => (
              <TabsPrimitive.Trigger
                key={project.title}
                value={project.title}
                ref={(element) => {
                  puckRefs.current[index] = element;
                }}
                style={{ width: layout.size, height: layout.size }}
                {...puckHandlers(index, project.title)}
                className="group absolute left-0 top-0 touch-manipulation rounded-full outline-none [-webkit-tap-highlight-color:transparent]"
              >
                <span
                  ref={(element) => {
                    faceRefs.current[index] = element;
                  }}
                  className={cn(
                    "flex size-full items-center justify-center overflow-hidden rounded-full bg-card",
                    // Chosen: the iris rim and the lavender ring, which turns
                    // iris under keyboard focus.
                    project.title === selected
                      ? cn("shadow-rim-chosen group-focus-visible:outline-iris", MARKED)
                      : cn("shadow-puck group-focus-visible:shadow-puck-focus", HOVER_RING),
                  )}
                >
                  <PuckFace project={project} />
                </span>
                <span
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 text-sm font-semibold tracking-[-0.01em]",
                    project.title === selected ? "bg-card text-iris" : "bg-card/80 text-foreground",
                  )}
                >
                  {project.title}
                </span>
              </TabsPrimitive.Trigger>
            ))}
        </TabsPrimitive.List>
      </div>

      {/* How to choose: the pucks say the rest, the panel below the open one. */}
      <p
        style={{ maxWidth: layout.width || undefined }}
        className="w-full self-center px-1 font-mono text-meta text-muted-foreground"
      >
        {!canHover ? labels.hintTouch : layout.still ? labels.hintStill : labels.hint}
      </p>
    </div>
  );
};

export default ProjectField;
