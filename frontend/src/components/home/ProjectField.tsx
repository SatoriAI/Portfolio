import {
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
import { ArrowDown } from "lucide-react";

import { MARKED } from "@/components/experience/circleStyles";
import { Button } from "@/components/ui/button";
import { projectIcons } from "@/config/projectIcons";
import { useOnceInView } from "@/hooks/use-in-view";
import { useMediaQuery, usePrefersReducedMotion } from "@/hooks/use-media-query";
import {
  expired,
  fitCanvas,
  grainStyle,
  heatAt,
  type HeatModel,
  type HeatSource,
  kernel,
  paintField,
} from "@/lib/heatKernel";
import {
  arrivingPucks,
  type Direction,
  type FieldLayout,
  fieldLayout,
  neighbour,
  type Point,
  type Puck,
  pushFrom,
  restingPuck,
  settled,
  stepPucks,
} from "@/lib/projectField";
import type { UiProject } from "@/lib/projectsService";
import { cn } from "@/lib/utils";

/**
 * The projects as pucks on a heat field: the menu bar's heat kernel
 * (lib/heatKernel), given room to play.
 *
 * Every project is a white round puck with its icon, its name under it, at a
 * home of its own (lib/projectField). The first time the field is well in
 * view one pulse of heat spreads from its centre and the pucks burst out from
 * it to their homes; after that nothing moves on its own. The reader is the
 * only heat: a mouse moving over the field leaves kernels that spread and
 * fade, as over the menu bar, and the pucks lean a few pixels toward the
 * warmth and spring back. The warmest one, or the one under the pointer or
 * focus, is named in the line under the field. A click on the empty field
 * sends a pulse that nudges the pucks near it; a puck can be dragged and
 * flung, and bounces off the others back home. Choosing one gives it the
 * site's lavender ring and a short warm flood, under 300 ms, and the panel
 * below shows it.
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
  /** The line under the field while nothing is warm, where a mouse can warm it. */
  hint: string;
  /** The same, on touch. */
  hintTouch: string;
  /** The action beside a named project. */
  open: string;
  /** Beside a named project that is already the open one. */
  opened: string;
};

type ProjectFieldProps = {
  projects: readonly UiProject[];
  subtitles: Record<string, string>;
  /** The open project's title. */
  selected: string;
  onOpen: (title: string) => void;
  labels: ProjectFieldLabels;
};

/** The resting field: lavender from the lower left, blush from the upper right. */
const RESTING = [
  { x: 0.06, y: 1, peak: 0.5, channel: 0 },
  { x: 0.94, y: 0, peak: 0.42, channel: 1 },
] as const;
/** A resting source's e-fold radius, in widths, as HeatField's (RESTING_SPREAD). */
const RESTING_RADIUS = 0.34;

/** The kinds of heat, each a kernel model in pixels and seconds, born `radius` wide. */
const model = (peak: number, scale: number, radius: number, lifetime: number): HeatModel => ({
  peak,
  scale,
  diffusivity: radius ** 2 / (4 * scale),
  lifetime,
});
const KINDS = {
  /** Left by a moving mouse, or by focus: the menu bar's heat at a puck's size. */
  pointer: { model: model(0.26, 0.12, 44, 1.6), channel: 0, pulls: true },
  /** A click on the empty field. */
  pulse: { model: model(0.5, 0.08, 60, 1.4), channel: 1, pulls: true },
  /** The one arrival, from the centre, filling the field over 2.4 s. */
  arrival: { model: model(0.55, 0.1, 120, 2.4), channel: 0, pulls: false },
  /** Opening a project: a short warm flood from its puck. */
  flood: { model: model(0.5, 0.03, 115, 0.3), channel: 1, pulls: false },
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
/** Warmth below this does not name a puck. */
const NAMED_WARMTH = 0.06;

type Sim = {
  layout: FieldLayout;
  pucks: Puck[];
  clock: number;
  sources: Record<Kind, HeatSource[]>;
  /** The resting field per cell, lavender then blush. */
  rest: Float32Array;
  rows: number;
  hovered: number;
  focused: number;
  lastPointer: Point | null;
  /** Whether the arrival has begun (or was never to be played). */
  arrived: boolean;
  visible: boolean;
  frame: number | null;
  last: number | null;
  frames: number;
};

type Gesture = { index: number; id: number; start: Point; offset: Point; moved: boolean };

const noSources = (): Record<Kind, HeatSource[]> => ({
  pointer: [],
  pulse: [],
  arrival: [],
  flood: [],
});

const restingField = (layout: FieldLayout) => {
  const aspect = layout.width > 0 ? layout.height / layout.width : 0.5;
  const rows = Math.max(16, Math.min(160, Math.round(COLS * aspect)));
  const rest = new Float32Array(COLS * rows * 2);
  for (let row = 0; row < rows; row++) {
    const y = ((row + 0.5) / rows) * aspect;
    for (let col = 0; col < COLS; col++) {
      const x = (col + 0.5) / COLS;
      for (const source of RESTING) {
        const r2 = (x - source.x) ** 2 + (y - source.y * aspect) ** 2;
        rest[(row * COLS + col) * 2 + source.channel] += kernel(
          source.peak,
          1,
          RESTING_RADIUS ** 2 / 4,
          1,
          r2,
        );
      }
    }
  }
  return { rest, rows };
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

const ARROWS: Record<string, Direction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

const ProjectField = ({ projects, subtitles, selected, onOpen, labels }: ProjectFieldProps) => {
  const reducedMotion = usePrefersReducedMotion();
  const canHover = useMediaQuery("(hover: hover)");
  const fieldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const puckRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const faceRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const gesture = useRef<Gesture | null>(null);
  const swallowClick = useRef(-1);
  const sim = useRef<Sim | null>(null);

  const [width, setWidth] = useState(0);
  const layout = useMemo(
    () => fieldLayout(projects.length, width, reducedMotion),
    [projects.length, width, reducedMotion],
  );
  /** The puck named in the line under the field, or -1. */
  const [named, setNamed] = useState(-1);

  // The field's width, before the first paint and on every resize.
  useLayoutEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    setWidth(field.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(field);
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
    paintField(ctx, COLS, s.rows, (u, v, alpha) => {
      const cell = (Math.floor(v * s.rows) * COLS + Math.floor(u * COLS)) * 2;
      alpha[0] += s.rest[cell];
      alpha[1] += s.rest[cell + 1];
      for (const kind of live) {
        const { model: m, channel } = KINDS[kind];
        alpha[channel] += heatAt(s.sources[kind], m, u * w, v * h, s.clock);
      }
    });
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
      element.style.opacity = !s.arrived || puck.releaseAt !== null ? "0" : "";
      // Squashed along its motion, so a flung puck reads as soft.
      const stretch = Math.min(0.2, Math.hypot(puck.vx, puck.vy) / 2800);
      const angle = Math.atan2(puck.vy, puck.vx);
      face.style.transform =
        puck.s === 1 && stretch === 0
          ? ""
          : `rotate(${angle}rad) scale(${(puck.s * (1 + stretch)).toFixed(4)}, ${(puck.s / (1 + stretch)).toFixed(4)}) rotate(${-angle}rad)`;
    });
  };

  const name = () => {
    const s = sim.current;
    if (!s) return;
    let index = s.hovered >= 0 ? s.hovered : s.focused;
    if (index < 0) {
      let warmest = NAMED_WARMTH;
      s.pucks.forEach((puck, i) => {
        if (puck.warmth > warmest) {
          warmest = puck.warmth;
          index = i;
        }
      });
    }
    setNamed(index);
  };

  const busy = (s: Sim) =>
    KIND_NAMES.some((kind) => s.sources[kind].length > 0) || !settled(s.pucks);

  const frame = (now: number) => {
    const s = sim.current;
    if (!s) return;
    s.frame = null;
    const dt = Math.min(1 / 30, Math.max(1 / 240, (now - (s.last ?? now)) / 1000 || 1 / 60));
    s.last = now;
    s.clock += dt;
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
    if ((s.frames++ & 3) === 0) name();
    if (busy(s)) schedule();
    else {
      s.last = null;
      name();
    }
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
    list.push({ ...at, bornAt: s.clock });
    if (list.length > POINTER_MAX) list.shift();
    schedule();
  };

  // A new layout: the pucks keep their state and move home to the new
  // homes; a new number of projects, or a change to or from the still grid,
  // starts them afresh.
  useLayoutEffect(() => {
    if (width === 0) return;
    const s = sim.current;
    const field = restingField(layout);
    if (!s || s.pucks.length !== layout.slots.length || s.layout.still !== layout.still) {
      if (s?.frame != null) cancelAnimationFrame(s.frame);
      sim.current = {
        layout,
        pucks: layout.slots.map(restingPuck),
        clock: s?.clock ?? 0,
        sources: noSources(),
        ...field,
        hovered: -1,
        focused: -1,
        lastPointer: null,
        arrived: layout.still || (s?.arrived ?? false),
        visible: s?.visible ?? false,
        frame: null,
        last: null,
        frames: 0,
      };
    } else {
      s.layout = layout;
      s.rest = field.rest;
      s.rows = field.rows;
      layout.slots.forEach((slot, i) => {
        const puck = s.pucks[i];
        puck.hx = slot.x;
        puck.hy = slot.y;
      });
      schedule();
    }
    write();
    paint();
    // write, paint and schedule read refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, width]);

  // The arrival, once, the first time the field is well in view.
  const arrive = () => {
    const s = sim.current;
    if (!s || s.arrived) return;
    s.arrived = true;
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
      name();
      schedule();
    },
    onPointerLeave: () => {
      const s = sim.current;
      if (!s) return;
      if (s.hovered === index) s.hovered = -1;
      s.pucks[index].pressed = false;
      name();
      schedule();
    },
    onFocus: () => {
      const s = sim.current;
      if (!s) return;
      // Reached by the keyboard before the arrival played: just show them.
      arrive();
      s.focused = index;
      const puck = s.pucks[index];
      heat("pointer", { x: puck.hx, y: puck.hy });
      name();
    },
    onBlur: () => {
      const s = sim.current;
      if (!s) return;
      if (s.focused === index) s.focused = -1;
      name();
      schedule();
    },
    // A press must not choose the project at once, as a tab otherwise does:
    // it may be the start of a drag. The click chooses.
    onMouseDown: (event: MouseEvent) => event.preventDefault(),
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      const s = sim.current;
      if (!s) return;
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
    onClick: () => {
      if (swallowClick.current === index) {
        swallowClick.current = -1;
        return;
      }
      onOpen(title);
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      const direction = ARROWS[event.key];
      if (!direction) return;
      // Instead of the tab list's own arrows, which only know a line.
      event.preventDefault();
      puckRefs.current[neighbour(layout.slots, index, direction)]?.focus();
    },
  });

  const endGesture = (index: number) => {
    const s = sim.current;
    if (!s) return;
    const puck = s.pucks[index];
    puck.pressed = false;
    const g = gesture.current;
    if (g?.index === index && g.moved) {
      // Thrown: it keeps its speed, and the click that ends a drag opens nothing.
      swallowClick.current = index;
      puck.sv += 3;
    }
    puck.drag = null;
    gesture.current = null;
    schedule();
  };

  const namedProject = named >= 0 ? projects[named] : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={fieldRef}
        style={{ height: layout.height }}
        onPointerMove={onFieldPointerMove}
        onClick={onFieldClick}
        className="relative isolate select-none overflow-hidden rounded-card border border-border bg-background"
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 size-full"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={grainStyle}
        />
        <TabsPrimitive.List aria-label={labels.field} className="absolute inset-0">
          {projects.map((project, index) => (
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
                  "flex size-full items-center justify-center overflow-hidden rounded-full bg-card shadow-rim group-focus-visible:shadow-rim-focus",
                  project.title === selected ? MARKED : HOVER_RING,
                )}
              >
                <PuckFace project={project} />
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card/80 px-2 text-sm font-semibold tracking-[-0.01em] text-foreground">
                {project.title}
              </span>
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      </div>

      {/* The warm one, named; or how to warm them. */}
      <div className="flex min-h-11 items-center gap-3 px-1">
        {namedProject ? (
          <>
            <p className="min-w-0 flex-1 truncate text-base">
              <span className="font-semibold">{namedProject.title}</span>
              {subtitles[namedProject.title] && (
                <span className="text-muted-foreground"> · {subtitles[namedProject.title]}</span>
              )}
            </p>
            {namedProject.title === selected ? (
              <span className="shrink-0 font-mono text-meta text-muted-foreground">
                {labels.opened}
              </span>
            ) : (
              // The keyboard opens the focused puck with Enter; this is for the pointer.
              <Button
                variant="outline"
                size="sm"
                tabIndex={-1}
                className="shrink-0"
                onClick={() => onOpen(namedProject.title)}
              >
                {labels.open}
                <ArrowDown aria-hidden="true" />
              </Button>
            )}
          </>
        ) : (
          <p className="font-mono text-meta text-muted-foreground">
            {canHover ? labels.hint : labels.hintTouch}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectField;
