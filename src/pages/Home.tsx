import {
  IonBadge,
  IonButton,
  IonCard,
  IonChip,
  IonContent,
  IonIcon,
  IonPage,
  IonPopover,
} from "@ionic/react";
import {
  alertCircleOutline,
  closeCircleOutline,
  exitOutline,
  homeOutline,
  informationCircleOutline,
  pauseCircleOutline,
  playCircleOutline,
  refresh,
  time,
} from "ionicons/icons";
import "./Home.css";
import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { App } from "@capacitor/app";

type Difficulty = "basic" | "intermediate" | "advanced";

type GameSettings = {
  maxMandalas: number;
  time: number;
  mandalasAvailable: string[];
};

type ConfettiPiece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
};

type MandalaColor = {
  id: string;
  hex: string;
};

type MandalaSolution = Record<string, string>;
type FillState = Record<string, string>;

type MandalaComponentProps = {
  fillState: FillState;
  onFill: (id: string) => void;
  solution: MandalaSolution;
  showNumbers?: boolean;
};

type MandalaDefinition = {
  id: string;
  aliases: string[];
  name: string;
  level: Difficulty;
  colors: MandalaColor[];
  solution: MandalaSolution;
  component: (props: MandalaComponentProps) => ReactElement;
};

type MandalaRuntimeConfig = {
  nivel?: string;
  autor?: string;
  version?: string;
  fecha?: string;
  descripcion?: string;
  nombreApp?: string;
  plataformas?: string[];
  mandalasDisponibles?: {
    basico?: string[];
    intermedio?: string[];
    avanzado?: string[];
  };
};

export interface PlayProps {
  difficulty?: Difficulty;
}

const DEFAULT_MANDALAS_BY_LEVEL: Record<Difficulty, string[]> = {
  basic: ["nat1", "nat2", "nat3", "nat4", "nat5", "nat6", "nat7", "nat8"],
  intermediate: [
    "emo1",
    "emo2",
    "emo3",
    "emo4",
    "emo5",
    "emo6",
    "emo7",
    "emo8",
  ],
  advanced: [
    "geo1",
    "geo2",
    "geo3",
    "geo4",
    "geo5",
    "geo6",
    "geo7",
    "geo8",
  ],
};

const DEFAULT_FILL = "#ffffff";
const STROKE_COLOR = "#333";

const getContrastColor = (hex: string): string => {
  const value = hex.replace("#", "");
  if (value.length !== 6) return "#000";

  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);

  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? "#000" : "#fff";
};

const normalizeHex = (hex: string): string => hex.trim().toLowerCase();

const polarPoint = (
  centerX: number,
  centerY: number,
  radius: number,
  degrees: number,
) => {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: centerX + Math.cos(radians) * radius,
    y: centerY + Math.sin(radians) * radius,
  };
};

const getStarPoints = (
  numPoints: number,
  innerRadius: number,
  outerRadius: number,
  centerX: number,
  centerY: number,
) => {
  const points: Array<{ x: number; y: number }> = [];
  const step = Math.PI / numPoints;
  let angle = -Math.PI / 2;

  for (let i = 0; i < numPoints * 2; i += 1) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
    angle += step;
  }

  return points;
};

const getPolygonPoints = (
  sides: number,
  radius: number,
  centerX: number,
  centerY: number,
  rotationDeg = 0,
) => {
  const points: Array<{ x: number; y: number }> = [];
  const step = (Math.PI * 2) / sides;
  let angle = -Math.PI / 2 + (rotationDeg * Math.PI) / 180;

  for (let i = 0; i < sides; i += 1) {
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    });
    angle += step;
  }

  return points;
};

const pointsToString = (points: Array<{ x: number; y: number }>) =>
  points.map((point) => `${point.x},${point.y}`).join(" ");

const getWedgePath = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) => {
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
};

type NumberLabelProps = {
  id: string;
  x: number;
  y: number;
  solution: MandalaSolution;
  size?: number;
  color?: string;
};

const NumberLabel = ({
  id,
  x,
  y,
  solution,
  size = 18,
  color = STROKE_COLOR,
}: NumberLabelProps) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    dominantBaseline="middle"
    fontSize={size}
    fontWeight={700}
    fill={color}
    className="mandala-number"
    style={{ pointerEvents: "none" }}
  >
    {solution[id] ?? "?"}
  </text>
);

const MandalaArbol1 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const crownParts = [0, 45, 90, 135, 180, 225, 270, 315].map(
    (angle, index) => {
      const point = polarPoint(250, 180, 80, angle);
      return {
        id: `p${index + 5}`,
        x: point.x,
        y: point.y,
      };
    },
  );

  return (
    <>
      <circle
        cx={250}
        cy={250}
        r={230}
        fill="transparent"
        stroke={STROKE_COLOR}
        strokeWidth={3}
      />

      <rect
        x={230}
        y={250}
        width={40}
        height={80}
        fill={fillState.p1 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />
      <path
        d="M 230 330 Q 180 360 120 380 Q 120 400 140 410 Q 200 390 235 340 Z"
        fill={fillState.p2 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p2")}
      />
      <path
        d="M 245 335 L 245 410 L 255 410 L 255 335 Z"
        fill={fillState.p3 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p3")}
      />
      <path
        d="M 270 330 Q 320 360 380 380 Q 380 400 360 410 Q 300 390 265 340 Z"
        fill={fillState.p4 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p4")}
      />

      {crownParts.map((part) => (
        <circle
          key={part.id}
          cx={part.x}
          cy={part.y}
          r={50}
          fill={fillState[part.id] ?? DEFAULT_FILL}
          stroke={STROKE_COLOR}
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(part.id)}
        />
      ))}

      {showNumbers && (
        <>
          <NumberLabel id="p1" x={250} y={290} solution={solution} size={20} />
          <NumberLabel id="p2" x={175} y={370} solution={solution} size={20} />
          <NumberLabel id="p3" x={250} y={372} solution={solution} size={20} />
          <NumberLabel id="p4" x={315} y={370} solution={solution} size={20} />

          {crownParts.map((part) => (
            <NumberLabel
              key={`${part.id}-label`}
              id={part.id}
              x={part.x}
              y={part.y}
              solution={solution}
              size={18}
            />
          ))}
        </>
      )}
    </>
  );
};

const MandalaFlor1 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const outerZones = [
    { id: "p3", angle: 270 },
    { id: "p4", angle: 315 },
    { id: "p5", angle: 0 },
    { id: "p6", angle: 45 },
    { id: "p7", angle: 90 },
    { id: "p8", angle: 135 },
    { id: "p9", angle: 180 },
    { id: "p10", angle: 225 },
  ].map((zone) => {
    const center = polarPoint(250, 250, 170, zone.angle);
    const radians = (zone.angle * Math.PI) / 180;
    const ux = Math.cos(radians);
    const uy = Math.sin(radians);
    const px = -uy;
    const py = ux;

    const baseCenter = {
      x: center.x + ux * 24,
      y: center.y + uy * 24,
    };
    const tip = {
      x: center.x + ux * 46,
      y: center.y + uy * 46,
    };
    const baseLeft = {
      x: baseCenter.x + px * 8,
      y: baseCenter.y + py * 8,
    };
    const baseRight = {
      x: baseCenter.x - px * 8,
      y: baseCenter.y - py * 8,
    };

    return {
      ...zone,
      center,
      triangle: `M ${baseLeft.x} ${baseLeft.y} L ${tip.x} ${tip.y} L ${baseRight.x} ${baseRight.y} Z`,
    };
  });

  return (
    <>
      <circle
        cx={250}
        cy={250}
        r={84}
        fill={fillState.p1 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />

      <path
        d="M 250 135 A 115 115 0 1 1 250 365 A 115 115 0 1 1 250 135 Z M 250 158 A 92 92 0 1 0 250 342 A 92 92 0 1 0 250 158 Z"
        fill={fillState.p2 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        fillRule="evenodd"
        className="mandala-path"
        onClick={() => onFill("p2")}
      />

      {outerZones.map((zone) => (
        <path
          key={`${zone.id}-triangle`}
          d={zone.triangle}
          fill="transparent"
          stroke={STROKE_COLOR}
          strokeWidth={3}
        />
      ))}

      {outerZones.map((zone) => (
        <circle
          key={zone.id}
          cx={zone.center.x}
          cy={zone.center.y}
          r={30}
          fill={fillState[zone.id] ?? DEFAULT_FILL}
          stroke={STROKE_COLOR}
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}

      {showNumbers && (
        <>
          <NumberLabel id="p1" x={250} y={250} solution={solution} size={24} />
          <NumberLabel id="p2" x={250} y={142} solution={solution} size={18} />
          <NumberLabel id="p2" x={250} y={358} solution={solution} size={18} />
          {outerZones.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.center.x}
              y={zone.center.y}
              solution={solution}
              size={18}
            />
          ))}
        </>
      )}
    </>
  );
};

const MandalaMariposa1 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const leftAntennaColor = fillState.p2 ?? STROKE_COLOR;
  const rightAntennaColor = fillState.p3 ?? STROKE_COLOR;

  return (
    <>
      <circle
        cx={250}
        cy={250}
        r={220}
        fill={fillState.p10 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("p10")}
      />

      <path
        d="M 250 200 Q 150 150 120 180 Q 100 220 140 240 Q 200 230 245 220 Z"
        fill={fillState.p4 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p4")}
      />
      <path
        d="M 250 200 Q 350 150 380 180 Q 400 220 360 240 Q 300 230 255 220 Z"
        fill={fillState.p5 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p5")}
      />

      <path
        d="M 245 280 Q 180 300 150 330 Q 140 360 170 370 Q 220 350 245 310 Z"
        fill={fillState.p6 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p6")}
      />
      <path
        d="M 255 280 Q 320 300 350 330 Q 360 360 330 370 Q 280 350 255 310 Z"
        fill={fillState.p7 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p7")}
      />

      <circle
        cx={180}
        cy={200}
        r={28}
        fill={fillState.p8 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("p8")}
      />
      <circle
        cx={320}
        cy={200}
        r={28}
        fill={fillState.p9 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("p9")}
      />

      <rect
        x={237}
        y={180}
        width={26}
        height={140}
        rx={13}
        ry={13}
        fill={fillState.p1 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />

      <g className="mandala-path" onClick={() => onFill("p2")}>
        <line
          x1={245}
          y1={180}
          x2={230}
          y2={150}
          stroke={leftAntennaColor}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <circle
          cx={230}
          cy={150}
          r={6}
          fill={leftAntennaColor}
          stroke={leftAntennaColor}
          strokeWidth={1}
        />
      </g>

      <g className="mandala-path" onClick={() => onFill("p3")}>
        <line
          x1={255}
          y1={180}
          x2={270}
          y2={150}
          stroke={rightAntennaColor}
          strokeWidth={4}
          strokeLinecap="round"
        />
        <circle
          cx={270}
          cy={150}
          r={6}
          fill={rightAntennaColor}
          stroke={rightAntennaColor}
          strokeWidth={1}
        />
      </g>

      {showNumbers && (
        <>
          <NumberLabel id="p1" x={250} y={250} solution={solution} size={20} />
          <NumberLabel id="p2" x={228} y={160} solution={solution} size={16} />
          <NumberLabel id="p3" x={272} y={160} solution={solution} size={16} />
          <NumberLabel id="p4" x={165} y={195} solution={solution} size={18} />
          <NumberLabel id="p5" x={335} y={195} solution={solution} size={18} />
          <NumberLabel id="p6" x={180} y={335} solution={solution} size={18} />
          <NumberLabel id="p7" x={320} y={335} solution={solution} size={18} />
          <NumberLabel id="p8" x={180} y={200} solution={solution} size={16} />
          <NumberLabel id="p9" x={320} y={200} solution={solution} size={16} />
          <NumberLabel id="p10" x={250} y={70} solution={solution} size={20} />
        </>
      )}
    </>
  );
};

const MandalaSol = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const cx = 250;
  const cy = 250;

  const rays = Array.from({ length: 12 }, (_, index) => {
    const angle = index * 30;
    const p1 = polarPoint(cx, cy, 70, angle - 10);
    const p2 = polarPoint(cx, cy, 180, angle);
    const p3 = polarPoint(cx, cy, 70, angle + 10);

    return {
      id: `p${index + 3}`,
      angle,
      d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`,
    };
  });

  const starPoints = getStarPoints(8, 28, 50, cx, cy)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <>
      {rays.map((ray) => (
        <path
          key={ray.id}
          d={ray.d}
          fill={fillState[ray.id] ?? DEFAULT_FILL}
          stroke={STROKE_COLOR}
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(ray.id)}
        />
      ))}

      <circle
        cx={cx}
        cy={cy}
        r={68}
        fill={fillState.p2 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p2")}
      />

      <polygon
        points={starPoints}
        fill={fillState.p1 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />

      {showNumbers && (
        <>
          <NumberLabel id="p1" x={cx} y={cy} solution={solution} size={18} />
          <NumberLabel id="p2" x={cx} y={195} solution={solution} size={18} />
          {rays.map((ray) => {
            const labelPoint = polarPoint(cx, cy, 125, ray.angle);
            return (
              <NumberLabel
                key={`${ray.id}-label`}
                id={ray.id}
                x={labelPoint.x}
                y={labelPoint.y}
                solution={solution}
                size={16}
              />
            );
          })}
        </>
      )}
    </>
  );
};

const MandalaHoja = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => (
  <>
    <line
      x1={250}
      y1={430}
      x2={250}
      y2={250}
      stroke={fillState.p1 ?? DEFAULT_FILL}
      strokeWidth={20}
      strokeLinecap="round"
      className="mandala-path"
      onClick={() => onFill("p1")}
    />

    <path
      d="M 250 90 Q 220 160 250 280 Q 280 160 250 90 Z"
      fill={fillState.p2 ?? DEFAULT_FILL}
      stroke={STROKE_COLOR}
      strokeWidth={3}
      className="mandala-path"
      onClick={() => onFill("p2")}
    />
    <path
      d="M 250 130 Q 165 120 125 150 Q 138 190 225 205 Z"
      fill={fillState.p3 ?? DEFAULT_FILL}
      stroke={STROKE_COLOR}
      strokeWidth={3}
      className="mandala-path"
      onClick={() => onFill("p3")}
    />
    <path
      d="M 250 130 Q 335 120 375 150 Q 362 190 275 205 Z"
      fill={fillState.p4 ?? DEFAULT_FILL}
      stroke={STROKE_COLOR}
      strokeWidth={3}
      className="mandala-path"
      onClick={() => onFill("p4")}
    />
    <path
      d="M 250 190 Q 155 190 110 230 Q 125 270 240 250 Z"
      fill={fillState.p5 ?? DEFAULT_FILL}
      stroke={STROKE_COLOR}
      strokeWidth={3}
      className="mandala-path"
      onClick={() => onFill("p5")}
    />
    <path
      d="M 250 190 Q 345 190 390 230 Q 375 270 260 250 Z"
      fill={fillState.p6 ?? DEFAULT_FILL}
      stroke={STROKE_COLOR}
      strokeWidth={3}
      className="mandala-path"
      onClick={() => onFill("p6")}
    />
    <path
      d="M 250 260 Q 165 270 125 320 Q 155 345 245 305 Z"
      fill={fillState.p7 ?? DEFAULT_FILL}
      stroke={STROKE_COLOR}
      strokeWidth={3}
      className="mandala-path"
      onClick={() => onFill("p7")}
    />
    <path
      d="M 250 260 Q 335 270 375 320 Q 345 345 255 305 Z"
      fill={fillState.p8 ?? DEFAULT_FILL}
      stroke={STROKE_COLOR}
      strokeWidth={3}
      className="mandala-path"
      onClick={() => onFill("p8")}
    />

    {showNumbers && (
      <>
        <NumberLabel id="p1" x={250} y={360} solution={solution} size={22} />
        <NumberLabel id="p2" x={250} y={190} solution={solution} size={22} />
        <NumberLabel id="p3" x={175} y={160} solution={solution} size={18} />
        <NumberLabel id="p4" x={325} y={160} solution={solution} size={18} />
        <NumberLabel id="p5" x={160} y={225} solution={solution} size={18} />
        <NumberLabel id="p6" x={340} y={225} solution={solution} size={18} />
        <NumberLabel id="p7" x={180} y={295} solution={solution} size={18} />
        <NumberLabel id="p8" x={320} y={295} solution={solution} size={18} />
      </>
    )}
  </>
);

const MandalaArbol2 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const t1 = getPolygonPoints(3, 110, 250, 125)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const t2 = getPolygonPoints(3, 125, 250, 195)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const t3 = getPolygonPoints(3, 140, 250, 273)
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <>
      <polygon
        points={t1}
        fill={fillState.p1 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />
      <polygon
        points={t2}
        fill={fillState.p2 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p2")}
      />
      <polygon
        points={t3}
        fill={fillState.p3 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p3")}
      />
      <rect
        x={215}
        y={340}
        width={70}
        height={120}
        fill={fillState.p4 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p4")}
      />

      {showNumbers && (
        <>
          <NumberLabel id="p1" x={250} y={125} solution={solution} size={26} />
          <NumberLabel id="p2" x={250} y={195} solution={solution} size={26} />
          <NumberLabel id="p3" x={250} y={273} solution={solution} size={26} />
          <NumberLabel id="p4" x={250} y={400} solution={solution} size={26} />
        </>
      )}
    </>
  );
};

const MandalaPez = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const tail = pointsToString(getPolygonPoints(3, 70, 385, 250));

  return (
    <>
      <ellipse
        cx={250}
        cy={250}
        rx={110}
        ry={80}
        fill={fillState.body ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("body")}
      />
      <path
        d="M 250 170 Q 220 130 250 110 Q 280 130 250 170 Z"
        fill={fillState.topFin ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("topFin")}
      />
      <path
        d="M 250 330 Q 220 370 250 390 Q 280 370 250 330 Z"
        fill={fillState.bottomFin ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("bottomFin")}
      />
      <polygon
        points={tail}
        fill={fillState.tail ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("tail")}
      />
      <circle
        cx={190}
        cy={235}
        r={25}
        fill={fillState.eye ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("eye")}
      />
      <circle
        cx={195}
        cy={240}
        r={12}
        fill={fillState.pupil ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("pupil")}
      />
      <circle
        cx={250}
        cy={250}
        r={22}
        fill={fillState.scale1 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("scale1")}
      />
      <circle
        cx={290}
        cy={230}
        r={22}
        fill={fillState.scale2 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("scale2")}
      />
      <circle
        cx={290}
        cy={270}
        r={22}
        fill={fillState.scale3 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("scale3")}
      />
      <rect
        x={202.5}
        y={210}
        width={15}
        height={60}
        transform="rotate(-20 210 240)"
        fill={fillState.stripe1 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("stripe1")}
      />
      <rect
        x={222.5}
        y={210}
        width={15}
        height={60}
        transform="rotate(-20 230 240)"
        fill={fillState.stripe2 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("stripe2")}
      />

      {showNumbers && (
        <>
          <NumberLabel
            id="body"
            x={270}
            y={260}
            solution={solution}
            size={26}
          />
          <NumberLabel
            id="topFin"
            x={250}
            y={140}
            solution={solution}
            size={20}
          />
          <NumberLabel
            id="bottomFin"
            x={250}
            y={360}
            solution={solution}
            size={20}
          />
          <NumberLabel
            id="tail"
            x={385}
            y={250}
            solution={solution}
            size={22}
          />
          <NumberLabel id="eye" x={180} y={225} solution={solution} size={16} />
          <NumberLabel
            id="pupil"
            x={200}
            y={245}
            solution={solution}
            size={10}
          />
          <NumberLabel
            id="scale1"
            x={250}
            y={250}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="scale2"
            x={290}
            y={230}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="scale3"
            x={290}
            y={270}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="stripe1"
            x={208}
            y={235}
            solution={solution}
            size={12}
          />
          <NumberLabel
            id="stripe2"
            x={228}
            y={235}
            solution={solution}
            size={12}
          />
        </>
      )}
    </>
  );
};

const MandalaBuho = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const earL = pointsToString(getPolygonPoints(3, 45, 195, 110, 180));
  const earR = pointsToString(getPolygonPoints(3, 45, 305, 110, 180));
  const beak = pointsToString(getPolygonPoints(3, 25, 250, 210));

  return (
    <>
      <ellipse
        cx={250}
        cy={280}
        rx={90}
        ry={110}
        fill={fillState.body ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("body")}
      />
      <circle
        cx={250}
        cy={170}
        r={80}
        fill={fillState.head ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("head")}
      />
      <polygon
        points={earL}
        fill={fillState.earL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("earL")}
      />
      <polygon
        points={earR}
        fill={fillState.earR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("earR")}
      />
      <circle
        cx={215}
        cy={170}
        r={32}
        fill={fillState.eyeL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("eyeL")}
      />
      <circle
        cx={285}
        cy={170}
        r={32}
        fill={fillState.eyeR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("eyeR")}
      />
      <circle
        cx={220}
        cy={175}
        r={15}
        fill={fillState.pupilL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("pupilL")}
      />
      <circle
        cx={280}
        cy={175}
        r={15}
        fill={fillState.pupilR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("pupilR")}
      />
      <polygon
        points={beak}
        fill={fillState.beak ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("beak")}
      />
      <ellipse
        cx={175}
        cy={300}
        rx={35}
        ry={60}
        transform="rotate(-20 175 300)"
        fill={fillState.wingL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("wingL")}
      />
      <ellipse
        cx={325}
        cy={300}
        rx={35}
        ry={60}
        transform="rotate(20 325 300)"
        fill={fillState.wingR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("wingR")}
      />
      <rect
        x={221}
        y={352.5}
        width={18}
        height={35}
        fill={fillState.legL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("legL")}
      />
      <rect
        x={261}
        y={352.5}
        width={18}
        height={35}
        fill={fillState.legR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("legR")}
      />

      {showNumbers && (
        <>
          <NumberLabel
            id="body"
            x={250}
            y={320}
            solution={solution}
            size={26}
          />
          <NumberLabel
            id="head"
            x={250}
            y={140}
            solution={solution}
            size={24}
          />
          <NumberLabel
            id="earL"
            x={195}
            y={110}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="earR"
            x={305}
            y={110}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="eyeL"
            x={205}
            y={155}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="eyeR"
            x={295}
            y={155}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="pupilL"
            x={225}
            y={182}
            solution={solution}
            size={11}
          />
          <NumberLabel
            id="pupilR"
            x={275}
            y={182}
            solution={solution}
            size={11}
          />
          <NumberLabel
            id="beak"
            x={250}
            y={210}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="wingL"
            x={175}
            y={300}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="wingR"
            x={325}
            y={300}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="legL"
            x={230}
            y={370}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="legR"
            x={270}
            y={370}
            solution={solution}
            size={14}
          />
        </>
      )}
    </>
  );
};

const MandalaAlegria1 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const rays = Array.from({ length: 8 }, (_, index) => ({
    id: `r${index}`,
    angle: index * 45,
    d: getWedgePath(250, 250, 220, index * 45 - 15, index * 45 + 15),
  }));

  return (
    <>
      {rays.map((ray) => (
        <path
          key={ray.id}
          d={ray.d}
          fill={fillState[ray.id] ?? DEFAULT_FILL}
          stroke={STROKE_COLOR}
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(ray.id)}
        />
      ))}
      <circle
        cx={250}
        cy={250}
        r={120}
        fill={fillState.face ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("face")}
      />
      <circle
        cx={200}
        cy={220}
        r={12}
        fill={fillState.eyeL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("eyeL")}
      />
      <circle
        cx={300}
        cy={220}
        r={12}
        fill={fillState.eyeR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("eyeR")}
      />
      <circle
        cx={170}
        cy={260}
        r={20}
        fill={fillState.chL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("chL")}
      />
      <circle
        cx={330}
        cy={260}
        r={20}
        fill={fillState.chR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("chR")}
      />
      <path
        d="M 190 290 Q 250 380 310 290 Q 250 330 190 290 Z"
        fill={fillState.mouth ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("mouth")}
      />

      {showNumbers && (
        <>
          <NumberLabel
            id="face"
            x={250}
            y={150}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="eyeL"
            x={200}
            y={220}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="eyeR"
            x={300}
            y={220}
            solution={solution}
            size={16}
          />
          <NumberLabel id="chL" x={170} y={260} solution={solution} size={16} />
          <NumberLabel id="chR" x={330} y={260} solution={solution} size={16} />
          <NumberLabel
            id="mouth"
            x={250}
            y={320}
            solution={solution}
            size={16}
          />
          {rays.map((ray) => {
            const point = polarPoint(250, 250, 180, ray.angle);
            return (
              <NumberLabel
                key={`${ray.id}-label`}
                id={ray.id}
                x={point.x}
                y={point.y}
                solution={solution}
                size={16}
              />
            );
          })}
        </>
      )}
    </>
  );
};

const MandalaTristeza1 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const drops = [
    { id: "d1", x: 150, y: 350 },
    { id: "d2", x: 250, y: 400 },
    { id: "d3", x: 350, y: 350 },
    { id: "d4", x: 100, y: 300 },
    { id: "d5", x: 400, y: 300 },
  ];

  return (
    <>
      {drops.map((drop) => (
        <path
          key={drop.id}
          d={`M ${drop.x} ${drop.y - 30} Q ${drop.x - 20} ${drop.y + 10} ${drop.x} ${drop.y + 30} Q ${drop.x + 20} ${drop.y + 10} ${drop.x} ${drop.y - 30} Z`}
          fill={fillState[drop.id] ?? DEFAULT_FILL}
          stroke={STROKE_COLOR}
          strokeWidth={2}
          className="mandala-path"
          onClick={() => onFill(drop.id)}
        />
      ))}
      <path
        d="M 140 200 A 110 110 0 1 1 360 200 C 360 350 250 350 250 350 C 250 350 140 350 140 200 Z"
        fill={fillState.face ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("face")}
      />
      <path
        d="M 180 210 Q 200 190 220 210 Z"
        fill={fillState.eyeL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeL")}
      />
      <path
        d="M 280 210 Q 300 190 320 210 Z"
        fill={fillState.eyeR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeR")}
      />
      <path
        d="M 310 220 Q 300 240 310 260 Q 320 240 310 220 Z"
        fill={fillState.tear ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("tear")}
      />
      <path
        d="M 210 300 Q 250 270 290 300 L 290 310 Q 250 280 210 310 Z"
        fill={fillState.mouth ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("mouth")}
      />

      {showNumbers && (
        <>
          <NumberLabel
            id="face"
            x={240}
            y={150}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="eyeL"
            x={190}
            y={190}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="eyeR"
            x={290}
            y={190}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="tear"
            x={305}
            y={235}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="mouth"
            x={240}
            y={285}
            solution={solution}
            size={16}
          />
          {drops.map((drop) => (
            <NumberLabel
              key={`${drop.id}-label`}
              id={drop.id}
              x={drop.x}
              y={drop.y}
              solution={solution}
              size={16}
            />
          ))}
        </>
      )}
    </>
  );
};

const MandalaIra = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const star = pointsToString(getStarPoints(12, 140, 220, 250, 250));

  return (
    <>
      <polygon
        points={star}
        fill={fillState.bg ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("bg")}
      />
      <rect
        x={150}
        y={150}
        width={200}
        height={200}
        rx={40}
        ry={40}
        fill={fillState.face ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("face")}
      />
      <path
        d="M 170 200 L 240 230 L 240 210 L 170 180 Z"
        fill={fillState.browL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("browL")}
      />
      <path
        d="M 330 200 L 260 230 L 260 210 L 330 180 Z"
        fill={fillState.browR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("browR")}
      />
      <circle
        cx={200}
        cy={245}
        r={20}
        fill={fillState.eyeL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeL")}
      />
      <circle
        cx={300}
        cy={245}
        r={20}
        fill={fillState.eyeR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeR")}
      />
      <rect
        x={200}
        y={300}
        width={100}
        height={30}
        rx={5}
        ry={5}
        fill={fillState.mouth ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("mouth")}
      />

      {showNumbers && (
        <>
          <NumberLabel id="bg" x={250} y={90} solution={solution} size={18} />
          <NumberLabel
            id="face"
            x={250}
            y={160}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="browL"
            x={205}
            y={195}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="browR"
            x={295}
            y={195}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="eyeL"
            x={200}
            y={245}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="eyeR"
            x={300}
            y={245}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="mouth"
            x={250}
            y={315}
            solution={solution}
            size={18}
          />
        </>
      )}
    </>
  );
};

const MandalaMiedo1 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const hair = pointsToString(getStarPoints(16, 130, 180, 250, 230));

  return (
    <>
      <polygon
        points={hair}
        fill={fillState.hair ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("hair")}
      />
      <circle
        cx={250}
        cy={250}
        r={110}
        fill={fillState.face ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("face")}
      />
      <circle
        cx={210}
        cy={230}
        r={35}
        fill={fillState.eyeL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeL")}
      />
      <circle
        cx={290}
        cy={230}
        r={35}
        fill={fillState.eyeR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeR")}
      />
      <circle
        cx={210}
        cy={230}
        r={10}
        fill={fillState.pupilL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("pupilL")}
      />
      <circle
        cx={290}
        cy={230}
        r={10}
        fill={fillState.pupilR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("pupilR")}
      />
      <ellipse
        cx={250}
        cy={310}
        rx={40}
        ry={20}
        fill={fillState.mouth ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("mouth")}
      />

      {showNumbers && (
        <>
          <NumberLabel
            id="hair"
            x={240}
            y={120}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="face"
            x={240}
            y={180}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="eyeL"
            x={190}
            y={210}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="eyeR"
            x={270}
            y={210}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="pupilL"
            x={205}
            y={225}
            solution={solution}
            size={10}
          />
          <NumberLabel
            id="pupilR"
            x={285}
            y={225}
            solution={solution}
            size={10}
          />
          <NumberLabel
            id="mouth"
            x={240}
            y={300}
            solution={solution}
            size={18}
          />
        </>
      )}
    </>
  );
};

const MandalaAsco = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const blobs = [0, 60, 120, 180, 240, 300].map((angle) => {
    const point = polarPoint(250, 250, 160, angle);
    return {
      id: `b${angle}`,
      x: point.x,
      y: point.y,
    };
  });

  return (
    <>
      {blobs.map((blob) => (
        <circle
          key={blob.id}
          cx={blob.x}
          cy={blob.y}
          r={40}
          fill={fillState[blob.id] ?? DEFAULT_FILL}
          stroke={STROKE_COLOR}
          strokeWidth={2}
          className="mandala-path"
          onClick={() => onFill(blob.id)}
        />
      ))}
      <circle
        cx={250}
        cy={250}
        r={110}
        fill={fillState.face ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("face")}
      />
      <path
        d="M 180 220 L 220 220 L 200 210 Z"
        fill={fillState.eyeL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeL")}
      />
      <path
        d="M 280 220 L 320 220 L 300 210 Z"
        fill={fillState.eyeR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeR")}
      />
      <path
        d="M 200 300 Q 250 280 300 300 L 300 310 Q 250 290 200 310 Z"
        fill={fillState.mouth ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("mouth")}
      />
      <path
        d="M 230 310 L 270 310 Q 270 360 250 370 Q 230 360 230 310 Z"
        fill={fillState.tongue ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("tongue")}
      />

      {showNumbers && (
        <>
          {blobs.map((blob) => (
            <NumberLabel
              key={`${blob.id}-label`}
              id={blob.id}
              x={blob.x}
              y={blob.y}
              solution={solution}
              size={16}
            />
          ))}
          <NumberLabel
            id="face"
            x={240}
            y={160}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="eyeL"
            x={190}
            y={200}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="eyeR"
            x={290}
            y={200}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="mouth"
            x={240}
            y={280}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="tongue"
            x={240}
            y={330}
            solution={solution}
            size={16}
          />
        </>
      )}
    </>
  );
};

const MandalaSorpresa = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const bg = pointsToString(getStarPoints(8, 180, 220, 250, 250));

  return (
    <>
      <polygon
        points={bg}
        fill={fillState.bg ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("bg")}
      />
      <circle
        cx={250}
        cy={250}
        r={110}
        fill={fillState.face ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("face")}
      />
      <path
        d="M 180 180 A 25 25 0 0 1 220 180"
        fill="none"
        stroke={fillState.browL ?? STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("browL")}
      />
      <path
        d="M 280 180 A 25 25 0 0 1 320 180"
        fill="none"
        stroke={fillState.browR ?? STROKE_COLOR}
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("browR")}
      />
      <circle
        cx={200}
        cy={230}
        r={25}
        fill={fillState.eyeL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeL")}
      />
      <circle
        cx={300}
        cy={230}
        r={25}
        fill={fillState.eyeR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeR")}
      />
      <circle
        cx={250}
        cy={310}
        r={30}
        fill={fillState.mouth ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("mouth")}
      />

      {showNumbers && (
        <>
          <NumberLabel id="bg" x={240} y={90} solution={solution} size={16} />
          <NumberLabel
            id="face"
            x={240}
            y={150}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="browL"
            x={190}
            y={170}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="browR"
            x={290}
            y={170}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="eyeL"
            x={190}
            y={220}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="eyeR"
            x={290}
            y={220}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="mouth"
            x={240}
            y={300}
            solution={solution}
            size={16}
          />
        </>
      )}
    </>
  );
};

const MandalaCulpa = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const chains = Array.from({ length: 8 }, (_, index) => {
    const angle = index * 45;
    const center = polarPoint(250, 250, 180, angle);
    return { id: `chain${index}`, angle, center };
  });

  return (
    <>
      {chains.map((chain) => (
        <rect
          key={chain.id}
          x={chain.center.x - 15}
          y={chain.center.y - 25}
          width={30}
          height={50}
          rx={5}
          ry={5}
          transform={`rotate(${chain.angle} ${chain.center.x} ${chain.center.y})`}
          fill={fillState[chain.id] ?? DEFAULT_FILL}
          stroke={STROKE_COLOR}
          strokeWidth={2}
          className="mandala-path"
          onClick={() => onFill(chain.id)}
        />
      ))}
      <circle
        cx={250}
        cy={250}
        r={130}
        fill={fillState.bg ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("bg")}
      />
      <circle
        cx={250}
        cy={250}
        r={100}
        fill={fillState.face ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("face")}
      />
      <path
        d="M 195 210 L 235 220 L 235 215 L 195 205 Z"
        fill={fillState.browL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("browL")}
      />
      <path
        d="M 305 210 L 265 220 L 265 215 L 305 205 Z"
        fill={fillState.browR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("browR")}
      />
      <circle
        cx={215}
        cy={245}
        r={18}
        fill={fillState.eyeL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeL")}
      />
      <circle
        cx={285}
        cy={245}
        r={18}
        fill={fillState.eyeR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeR")}
      />
      <circle
        cx={215}
        cy={252}
        r={6}
        fill={fillState.pupilL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("pupilL")}
      />
      <circle
        cx={285}
        cy={252}
        r={6}
        fill={fillState.pupilR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("pupilR")}
      />
      <path
        d="M 220 295 Q 250 285 280 295 L 280 300 Q 250 290 220 300 Z"
        fill={fillState.mouth ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("mouth")}
      />
      <ellipse
        cx={170}
        cy={280}
        rx={25}
        ry={35}
        transform="rotate(-20 170 280)"
        fill={fillState.handL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("handL")}
      />
      <ellipse
        cx={330}
        cy={280}
        rx={25}
        ry={35}
        transform="rotate(20 330 280)"
        fill={fillState.handR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("handR")}
      />

      {showNumbers && (
        <>
          {chains.map((chain) => (
            <NumberLabel
              key={`${chain.id}-label`}
              id={chain.id}
              x={chain.center.x}
              y={chain.center.y}
              solution={solution}
              size={14}
            />
          ))}
          <NumberLabel id="bg" x={250} y={135} solution={solution} size={18} />
          <NumberLabel
            id="face"
            x={250}
            y={170}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="browL"
            x={215}
            y={210}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="browR"
            x={285}
            y={210}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="eyeL"
            x={215}
            y={245}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="eyeR"
            x={285}
            y={245}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="pupilL"
            x={215}
            y={252}
            solution={solution}
            size={10}
          />
          <NumberLabel
            id="pupilR"
            x={285}
            y={252}
            solution={solution}
            size={10}
          />
          <NumberLabel
            id="mouth"
            x={250}
            y={295}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="handL"
            x={170}
            y={280}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="handR"
            x={330}
            y={280}
            solution={solution}
            size={14}
          />
        </>
      )}
    </>
  );
};

const MandalaVerguenza = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const rays = Array.from({ length: 12 }, (_, index) => {
    const angle = index * 30;
    const p1 = polarPoint(250, 250, 140, angle);
    const p2 = polarPoint(250, 250, 200, angle);
    return {
      id: `ray${index}`,
      angle,
      p1,
      p2,
    };
  });

  return (
    <>
      {rays.map((ray) => (
        <line
          key={ray.id}
          x1={ray.p1.x}
          y1={ray.p1.y}
          x2={ray.p2.x}
          y2={ray.p2.y}
          stroke={fillState[ray.id] ?? DEFAULT_FILL}
          strokeWidth={5}
          strokeLinecap="round"
          className="mandala-path"
          onClick={() => onFill(ray.id)}
        />
      ))}
      <circle
        cx={250}
        cy={250}
        r={110}
        fill={fillState.face ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={4}
        className="mandala-path"
        onClick={() => onFill("face")}
      />
      <path
        d="M 195 230 Q 220 238 245 230 L 245 235 Q 220 242 195 235 Z"
        fill={fillState.eyeL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeL")}
      />
      <path
        d="M 255 230 Q 280 238 305 230 L 305 235 Q 280 242 255 235 Z"
        fill={fillState.eyeR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("eyeR")}
      />
      <circle
        cx={180}
        cy={265}
        r={30}
        fill={fillState.cheekL ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("cheekL")}
      />
      <circle
        cx={320}
        cy={265}
        r={30}
        fill={fillState.cheekR ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("cheekR")}
      />
      <ellipse
        cx={250}
        cy={305}
        rx={20}
        ry={10}
        fill={fillState.mouth ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("mouth")}
      />
      <path
        d="M 160 200 Q 150 215 160 230 Q 170 215 160 200 Z"
        fill={fillState.sweat1 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("sweat1")}
      />
      <path
        d="M 340 200 Q 330 215 340 230 Q 350 215 340 200 Z"
        fill={fillState.sweat2 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("sweat2")}
      />
      <path
        d="M 190 180 Q 185 190 190 200 Q 195 190 190 180 Z"
        fill={fillState.sweat3 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("sweat3")}
      />
      <path
        d="M 310 180 Q 305 190 310 200 Q 315 190 310 180 Z"
        fill={fillState.sweat4 ?? DEFAULT_FILL}
        stroke={STROKE_COLOR}
        strokeWidth={2}
        className="mandala-path"
        onClick={() => onFill("sweat4")}
      />

      {showNumbers && (
        <>
          {rays.map((ray) => {
            const point = polarPoint(250, 250, 170, ray.angle);
            return (
              <NumberLabel
                key={`${ray.id}-label`}
                id={ray.id}
                x={point.x}
                y={point.y}
                solution={solution}
                size={14}
              />
            );
          })}
          <NumberLabel
            id="face"
            x={250}
            y={160}
            solution={solution}
            size={18}
          />
          <NumberLabel
            id="eyeL"
            x={220}
            y={232}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="eyeR"
            x={280}
            y={232}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="cheekL"
            x={180}
            y={265}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="cheekR"
            x={320}
            y={265}
            solution={solution}
            size={16}
          />
          <NumberLabel
            id="mouth"
            x={250}
            y={305}
            solution={solution}
            size={14}
          />
          <NumberLabel
            id="sweat1"
            x={160}
            y={215}
            solution={solution}
            size={12}
          />
          <NumberLabel
            id="sweat2"
            x={340}
            y={215}
            solution={solution}
            size={12}
          />
          <NumberLabel
            id="sweat3"
            x={190}
            y={190}
            solution={solution}
            size={10}
          />
          <NumberLabel
            id="sweat4"
            x={310}
            y={190}
            solution={solution}
            size={10}
          />
        </>
      )}
    </>
  );
};

const MandalaGeo1 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const cx = 250;
  const cy = 250;
  const central = pointsToString(getPolygonPoints(6, 110, cx, cy));
  const outers = Array.from({ length: 6 }, (_, index) => {
    const angle = index * 60;
    const center = polarPoint(cx, cy, 140, angle);
    return {
      id: `p${index + 2}`,
      center,
      points: pointsToString(getPolygonPoints(6, 45, center.x, center.y)),
    };
  });
  const triangles = Array.from({ length: 6 }, (_, index) => {
    const angle = index * 60 + 30;
    const center = polarPoint(cx, cy, 95, angle);
    return {
      id: `p${index + 8}`,
      center,
      points: pointsToString(
        getPolygonPoints(3, 25, center.x, center.y, angle),
      ),
    };
  });

  return (
    <>
      <polygon
        points={central}
        fill={fillState.p1 ?? "#f5f5f5"}
        stroke="#222"
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />
      {outers.map((zone) => (
        <polygon
          key={zone.id}
          points={zone.points}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {triangles.map((zone) => (
        <polygon
          key={zone.id}
          points={zone.points}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {showNumbers && (
        <>
          <NumberLabel
            id="p1"
            x={cx}
            y={cy}
            solution={solution}
            size={24}
            color="#000"
          />
          {outers.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.center.x}
              y={zone.center.y}
              solution={solution}
              size={18}
              color="#000"
            />
          ))}
          {triangles.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.center.x}
              y={zone.center.y}
              solution={solution}
              size={14}
              color="#000"
            />
          ))}
        </>
      )}
    </>
  );
};

const MandalaGeo2 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const pos = [
    { id: "p2", x: 225, y: 150 },
    { id: "p3", x: 300, y: 225 },
    { id: "p4", x: 225, y: 300 },
    { id: "p5", x: 150, y: 225 },
  ];
  const diag = [
    { id: "p6", x: 270, y: 180 },
    { id: "p7", x: 270, y: 270 },
    { id: "p8", x: 180, y: 270 },
    { id: "p9", x: 180, y: 180 },
  ];

  return (
    <>
      <path
        d="M 225 195 L 255 225 L 225 255 L 195 225 Z"
        fill={fillState.p1 ?? "#f5f5f5"}
        stroke="#222"
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />
      {pos.map((zone) => (
        <path
          key={zone.id}
          d={`M ${zone.x} ${zone.y - 30} L ${zone.x + 22} ${zone.y} L ${zone.x} ${zone.y + 30} L ${zone.x - 22} ${zone.y} Z`}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {diag.map((zone) => (
        <path
          key={zone.id}
          d={`M ${zone.x} ${zone.y - 18} L ${zone.x + 18} ${zone.y} L ${zone.x} ${zone.y + 18} L ${zone.x - 18} ${zone.y} Z`}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {showNumbers && (
        <>
          <NumberLabel
            id="p1"
            x={213}
            y={213}
            solution={solution}
            size={14}
            color="#000"
          />
          {pos.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.x - 12}
              y={zone.y - 12}
              solution={solution}
              size={14}
              color="#000"
            />
          ))}
          {diag.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.x - 12}
              y={zone.y - 12}
              solution={solution}
              size={14}
              color="#000"
            />
          ))}
        </>
      )}
    </>
  );
};

const MandalaGeo3 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const parts = [
    { id: "p1", pts: 12, out: 112, inn: 60 },
    { id: "p2", pts: 8, out: 82, inn: 45 },
    { id: "p3", pts: 6, out: 52, inn: 30 },
  ];

  return (
    <>
      {parts.map((part) => (
        <polygon
          key={part.id}
          points={pointsToString(
            getStarPoints(part.pts, part.inn, part.out, 225, 225),
          )}
          fill={fillState[part.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(part.id)}
        />
      ))}
      <circle
        cx={225}
        cy={225}
        r={22}
        fill={fillState.p4 ?? "#f5f5f5"}
        stroke="#222"
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p4")}
      />
      {showNumbers && (
        <>
          {parts.map((part) => (
            <NumberLabel
              key={`${part.id}-label`}
              id={part.id}
              x={213}
              y={225 - (part.out - 22)}
              solution={solution}
              size={16}
              color="#000"
            />
          ))}
          <NumberLabel
            id="p4"
            x={213}
            y={225}
            solution={solution}
            size={16}
            color="#000"
          />
        </>
      )}
    </>
  );
};

const MandalaGeo4 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const mids = Array.from({ length: 6 }, (_, index) => {
    const center = polarPoint(225, 225, 68, index * 60);
    return { id: `p${index + 2}`, center };
  });
  const outers = Array.from({ length: 6 }, (_, index) => {
    const center = polarPoint(225, 225, 112, index * 60 + 30);
    return { id: `p${index + 8}`, center };
  });

  return (
    <>
      <circle
        cx={225}
        cy={225}
        r={45}
        fill={fillState.p1 ?? "#f5f5f5"}
        stroke="#222"
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />
      {mids.map((zone) => (
        <circle
          key={zone.id}
          cx={zone.center.x}
          cy={zone.center.y}
          r={38}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {outers.map((zone) => (
        <circle
          key={zone.id}
          cx={zone.center.x}
          cy={zone.center.y}
          r={22}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {showNumbers && (
        <>
          <NumberLabel
            id="p1"
            x={213}
            y={213}
            solution={solution}
            size={14}
            color="#000"
          />
          {mids.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.center.x - 12}
              y={zone.center.y - 12}
              solution={solution}
              size={14}
              color="#000"
            />
          ))}
          {outers.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.center.x - 12}
              y={zone.center.y - 12}
              solution={solution}
              size={14}
              color="#000"
            />
          ))}
        </>
      )}
    </>
  );
};

const MandalaGeo5 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const cx = 250;
  const cy = 250;

  const rects = [
    { id: "p2", x: cx - 40, y: cy - 95, width: 80, height: 30 },
    { id: "p3", x: cx - 40, y: cy + 65, width: 80, height: 30 },
    { id: "p4", x: cx - 95, y: cy - 40, width: 30, height: 80 },
    { id: "p5", x: cx + 65, y: cy - 40, width: 30, height: 80 },
  ];
  const cornerRects = [
    { id: "p6", cx: cx - 85, cy: cy - 85, width: 70, height: 25, angle: 45 },
    { id: "p7", cx: cx + 85, cy: cy - 85, width: 70, height: 25, angle: -45 },
    { id: "p8", cx: cx + 85, cy: cy + 85, width: 70, height: 25, angle: 45 },
    { id: "p9", cx: cx - 85, cy: cy + 85, width: 70, height: 25, angle: -45 },
  ];
  const tips = [
    { id: "p10", x: cx - 25, y: cy - 145, width: 50, height: 20 },
    { id: "p11", x: cx - 25, y: cy + 125, width: 50, height: 20 },
    { id: "p12", x: cx - 145, y: cy - 25, width: 20, height: 50 },
    { id: "p13", x: cx + 125, y: cy - 25, width: 20, height: 50 },
  ];

  return (
    <>
      <rect
        x={cx - 30}
        y={cy - 30}
        width={60}
        height={60}
        fill={fillState.p1 ?? "#f5f5f5"}
        stroke="#222"
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />
      {rects.map((zone) => (
        <rect
          key={zone.id}
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {cornerRects.map((zone) => (
        <rect
          key={zone.id}
          x={zone.cx - zone.width / 2}
          y={zone.cy - zone.height / 2}
          width={zone.width}
          height={zone.height}
          transform={`rotate(${zone.angle} ${zone.cx} ${zone.cy})`}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {tips.map((zone) => (
        <rect
          key={zone.id}
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}

      {showNumbers && (
        <>
          <NumberLabel
            id="p1"
            x={cx}
            y={cy}
            solution={solution}
            size={22}
            color="#000"
          />
          <NumberLabel
            id="p2"
            x={cx}
            y={cy - 80}
            solution={solution}
            size={18}
            color="#000"
          />
          <NumberLabel
            id="p3"
            x={cx}
            y={cy + 80}
            solution={solution}
            size={18}
            color="#000"
          />
          <NumberLabel
            id="p4"
            x={cx - 80}
            y={cy}
            solution={solution}
            size={18}
            color="#000"
          />
          <NumberLabel
            id="p5"
            x={cx + 80}
            y={cy}
            solution={solution}
            size={18}
            color="#000"
          />
          <NumberLabel
            id="p6"
            x={cx - 85}
            y={cy - 85}
            solution={solution}
            size={16}
            color="#000"
          />
          <NumberLabel
            id="p7"
            x={cx + 85}
            y={cy - 85}
            solution={solution}
            size={16}
            color="#000"
          />
          <NumberLabel
            id="p8"
            x={cx + 85}
            y={cy + 85}
            solution={solution}
            size={16}
            color="#000"
          />
          <NumberLabel
            id="p9"
            x={cx - 85}
            y={cy + 85}
            solution={solution}
            size={16}
            color="#000"
          />
          <NumberLabel
            id="p10"
            x={cx}
            y={cy - 135}
            solution={solution}
            size={14}
            color="#000"
          />
          <NumberLabel
            id="p11"
            x={cx}
            y={cy + 135}
            solution={solution}
            size={14}
            color="#000"
          />
          <NumberLabel
            id="p12"
            x={cx - 135}
            y={cy}
            solution={solution}
            size={14}
            color="#000"
          />
          <NumberLabel
            id="p13"
            x={cx + 135}
            y={cy}
            solution={solution}
            size={14}
            color="#000"
          />
        </>
      )}
    </>
  );
};

const MandalaGeo6 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const center = { x: 225, y: 225 };
  const traps = Array.from({ length: 6 }, (_, index) => {
    const angle = index * 60;
    const point = polarPoint(center.x, center.y, 60, angle);
    return { id: `p${index + 2}`, angle, point };
  });

  return (
    <>
      <polygon
        points={pointsToString(getPolygonPoints(6, 45, center.x, center.y))}
        fill={fillState.p1 ?? "#f5f5f5"}
        stroke="#222"
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />
      {traps.map((zone) => (
        <path
          key={zone.id}
          d="M -15 -25 L 15 -25 L 25 25 L -25 25 Z"
          transform={`translate(${zone.point.x} ${zone.point.y}) rotate(${zone.angle})`}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {showNumbers && (
        <>
          <NumberLabel
            id="p1"
            x={213}
            y={213}
            solution={solution}
            size={16}
            color="#000"
          />
          {traps.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.point.x - 12}
              y={zone.point.y - 12}
              solution={solution}
              size={16}
              color="#000"
            />
          ))}
        </>
      )}
    </>
  );
};

const MandalaGeo7 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const sq = [
    { id: "p2", x: 165, y: 165 },
    { id: "p3", x: 285, y: 165 },
    { id: "p4", x: 285, y: 285 },
    { id: "p5", x: 165, y: 285 },
  ];
  const hex = [
    { id: "p6", x: 225, y: 150 },
    { id: "p7", x: 300, y: 225 },
    { id: "p8", x: 225, y: 300 },
    { id: "p9", x: 150, y: 225 },
  ];

  return (
    <>
      <polygon
        points={pointsToString(getPolygonPoints(6, 40, 225, 225))}
        fill={fillState.p1 ?? "#f5f5f5"}
        stroke="#222"
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />
      {sq.map((zone) => (
        <rect
          key={zone.id}
          x={zone.x - 25}
          y={zone.y - 25}
          width={50}
          height={50}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {hex.map((zone) => (
        <polygon
          key={zone.id}
          points={pointsToString(getPolygonPoints(6, 28, zone.x, zone.y))}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      {showNumbers && (
        <>
          <NumberLabel
            id="p1"
            x={213}
            y={213}
            solution={solution}
            size={14}
            color="#000"
          />
          {sq.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.x - 12}
              y={zone.y - 12}
              solution={solution}
              size={14}
              color="#000"
            />
          ))}
          {hex.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.x - 12}
              y={zone.y - 12}
              solution={solution}
              size={14}
              color="#000"
            />
          ))}
        </>
      )}
    </>
  );
};

const MandalaGeo8 = ({
  fillState,
  onFill,
  solution,
  showNumbers = true,
}: MandalaComponentProps) => {
  const cx = 250;
  const cy = 250;
  const tri = Array.from({ length: 8 }, (_, index) => {
    const angle = index * 45;
    const center = polarPoint(cx, cy, 140, angle);
    return {
      id: `p${index + 2}`,
      center,
      points: pointsToString(
        getPolygonPoints(3, 45, center.x, center.y, angle + 90),
      ),
    };
  });
  const romboSize = 25;
  const diamonds = [
    { id: "p11", x: cx - 35, y: cy - 35 },
    { id: "p12", x: cx + 35, y: cy - 35 },
    { id: "p13", x: cx + 35, y: cy + 35 },
    { id: "p14", x: cx - 35, y: cy + 35 },
  ];

  return (
    <>
      <polygon
        points={pointsToString(getPolygonPoints(8, 100, cx, cy))}
        fill={fillState.p1 ?? "#f5f5f5"}
        stroke="#222"
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p1")}
      />
      {tri.map((zone) => (
        <polygon
          key={zone.id}
          points={zone.points}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}
      <rect
        x={cx - 35}
        y={cy - 35}
        width={70}
        height={70}
        fill={fillState.p10 ?? "#f5f5f5"}
        stroke="#222"
        strokeWidth={3}
        className="mandala-path"
        onClick={() => onFill("p10")}
      />
      {diamonds.map((zone) => (
        <path
          key={zone.id}
          d={`M ${zone.x} ${zone.y - romboSize} L ${zone.x + romboSize} ${zone.y} L ${zone.x} ${zone.y + romboSize} L ${zone.x - romboSize} ${zone.y} Z`}
          fill={fillState[zone.id] ?? "#f5f5f5"}
          stroke="#222"
          strokeWidth={3}
          className="mandala-path"
          onClick={() => onFill(zone.id)}
        />
      ))}

      {showNumbers && (
        <>
          <NumberLabel
            id="p1"
            x={cx}
            y={cy - 50}
            solution={solution}
            size={18}
            color="#000"
          />
          {tri.map((zone) => (
            <NumberLabel
              key={`${zone.id}-label`}
              id={zone.id}
              x={zone.center.x}
              y={zone.center.y}
              solution={solution}
              size={16}
              color="#000"
            />
          ))}
          <NumberLabel
            id="p10"
            x={cx}
            y={cy}
            solution={solution}
            size={16}
            color="#000"
          />
          <NumberLabel
            id="p11"
            x={cx - 35}
            y={cy - 35}
            solution={solution}
            size={14}
            color="#000"
          />
          <NumberLabel
            id="p12"
            x={cx + 35}
            y={cy - 35}
            solution={solution}
            size={14}
            color="#000"
          />
          <NumberLabel
            id="p13"
            x={cx + 35}
            y={cy + 35}
            solution={solution}
            size={14}
            color="#000"
          />
          <NumberLabel
            id="p14"
            x={cx - 35}
            y={cy + 35}
            solution={solution}
            size={14}
            color="#000"
          />
        </>
      )}
    </>
  );
};

const BASE_MANDALAS: MandalaDefinition[] = [
  {
    id: "nat1",
    aliases: ["nat1", "arbol", "arbol1", "m1"],
    name: "Arbol1",
    level: "basic",
    component: MandalaArbol1,
    colors: [
      { id: "1", hex: "#8B4513" },
      { id: "2", hex: "#654321" },
      { id: "3", hex: "#228B22" },
      { id: "4", hex: "#90EE90" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "2",
      p4: "2",
      p5: "3",
      p6: "4",
      p7: "3",
      p8: "4",
      p9: "3",
      p10: "4",
      p11: "3",
      p12: "4",
    },
  },
  {
    id: "nat2",
    aliases: ["nat2", "flor", "flor1", "m2"],
    name: "Flor",
    level: "basic",
    component: MandalaFlor1,
    colors: [
      { id: "1", hex: "#FFD700" },
      { id: "2", hex: "#FF69B4" },
      { id: "3", hex: "#FF1493" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "3",
      p4: "3",
      p5: "3",
      p6: "3",
      p7: "3",
      p8: "3",
      p9: "3",
      p10: "3",
    },
  },
  {
    id: "nat3",
    aliases: ["nat3", "mariposa", "mariposa1", "m3"],
    name: "Mariposa",
    level: "basic",
    component: MandalaMariposa1,
    colors: [
      { id: "1", hex: "#E1BEE7" },
      { id: "2", hex: "#9C27B0" },
      { id: "3", hex: "#4A148C" },
      { id: "4", hex: "#CE93D8" },
    ],
    solution: {
      p1: "3",
      p2: "3",
      p3: "3",
      p4: "2",
      p5: "2",
      p6: "1",
      p7: "1",
      p8: "4",
      p9: "4",
      p10: "1",
    },
  },
  {
    id: "nat4",
    aliases: ["nat4", "sol", "m4"],
    name: "Sol",
    level: "basic",
    component: MandalaSol,
    colors: [
      { id: "1", hex: "#FFD700" },
      { id: "2", hex: "#FFA500" },
      { id: "3", hex: "#FF8C00" },
      { id: "4", hex: "#FFEB3B" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "3",
      p4: "4",
      p5: "3",
      p6: "4",
      p7: "3",
      p8: "4",
      p9: "3",
      p10: "4",
      p11: "3",
      p12: "4",
      p13: "3",
      p14: "4",
    },
  },
  {
    id: "nat5",
    aliases: ["nat5", "hoja", "m5"],
    name: "Hoja",
    level: "basic",
    component: MandalaHoja,
    colors: [
      { id: "1", hex: "#8B4513" },
      { id: "2", hex: "#228B22" },
      { id: "3", hex: "#90EE90" },
      { id: "4", hex: "#32CD32" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "3",
      p4: "3",
      p5: "4",
      p6: "4",
      p7: "3",
      p8: "3",
    },
  },
  {
    id: "nat6",
    aliases: ["nat6", "arbol2", "arbol-geometrico", "m6"],
    name: "Arbol2",
    level: "basic",
    component: MandalaArbol2,
    colors: [
      { id: "1", hex: "#2E7D32" },
      { id: "2", hex: "#66BB6A" },
      { id: "3", hex: "#A5D6A7" },
      { id: "4", hex: "#6D4C41" },
    ],
    solution: {
      p1: "3",
      p2: "2",
      p3: "1",
      p4: "4",
    },
  },
  {
    id: "nat7",
    aliases: ["nat7", "pez", "m7"],
    name: "Pez",
    level: "basic",
    component: MandalaPez,
    colors: [
      { id: "1", hex: "#4FC3F7" },
      { id: "2", hex: "#FFCA28" },
      { id: "3", hex: "#29B6F6" },
      { id: "4", hex: "#FFFFFF" },
      { id: "5", hex: "#263238" },
    ],
    solution: {
      body: "1",
      topFin: "2",
      bottomFin: "2",
      tail: "2",
      eye: "4",
      pupil: "5",
      scale1: "3",
      scale2: "3",
      scale3: "3",
      stripe1: "5",
      stripe2: "5",
    },
  },
  {
    id: "nat8",
    aliases: ["nat8", "buho", "m8"],
    name: "Buho",
    level: "basic",
    component: MandalaBuho,
    colors: [
      { id: "1", hex: "#8D6E63" },
      { id: "2", hex: "#A1887F" },
      { id: "3", hex: "#FFD54F" },
      { id: "4", hex: "#263238" },
    ],
    solution: {
      body: "1",
      head: "2",
      earL: "4",
      earR: "4",
      eyeL: "3",
      eyeR: "3",
      pupilL: "4",
      pupilR: "4",
      beak: "3",
      wingL: "1",
      wingR: "1",
      legL: "2",
      legR: "2",
    },
  },
  {
    id: "emo1",
    aliases: ["emo1", "nat9", "alegria", "m9"],
    name: "Alegria",
    level: "intermediate",
    component: MandalaAlegria1,
    colors: [
      { id: "1", hex: "#FFE082" },
      { id: "2", hex: "#FFB300" },
      { id: "3", hex: "#FF7043" },
      { id: "4", hex: "#263238" },
    ],
    solution: {
      r0: "2",
      r1: "2",
      r2: "2",
      r3: "2",
      r4: "2",
      r5: "2",
      r6: "2",
      r7: "2",
      face: "1",
      eyeL: "4",
      eyeR: "4",
      chL: "3",
      chR: "3",
      mouth: "3",
    },
  },
  {
    id: "emo2",
    aliases: ["emo2", "nat10", "nube", "tristeza", "m10"],
    name: "Nube",
    level: "intermediate",
    component: MandalaTristeza1,
    colors: [
      { id: "1", hex: "#90CAF9" },
      { id: "2", hex: "#64B5F6" },
      { id: "3", hex: "#1E3A8A" },
      { id: "4", hex: "#E3F2FD" },
    ],
    solution: {
      d1: "2",
      d2: "2",
      d3: "2",
      d4: "2",
      d5: "2",
      face: "1",
      eyeL: "3",
      eyeR: "3",
      tear: "2",
      mouth: "3",
    },
  },
  {
    id: "emo3",
    aliases: ["emo3", "nat11", "furia", "ira", "m11"],
    name: "Furia",
    level: "intermediate",
    component: MandalaIra,
    colors: [
      { id: "1", hex: "#EF5350" },
      { id: "2", hex: "#FF7043" },
      { id: "3", hex: "#B71C1C" },
      { id: "4", hex: "#263238" },
    ],
    solution: {
      bg: "1",
      face: "2",
      browL: "3",
      browR: "3",
      eyeL: "4",
      eyeR: "4",
      mouth: "3",
    },
  },
  {
    id: "emo4",
    aliases: ["emo4", "nat12", "miedo", "m12"],
    name: "Miedo",
    level: "intermediate",
    component: MandalaMiedo1,
    colors: [
      { id: "1", hex: "#7E57C2" },
      { id: "2", hex: "#F3E5F5" },
      { id: "3", hex: "#FFFFFF" },
      { id: "4", hex: "#1F2937" },
    ],
    solution: {
      hair: "1",
      face: "2",
      eyeL: "3",
      eyeR: "3",
      pupilL: "4",
      pupilR: "4",
      mouth: "4",
    },
  },
  {
    id: "emo5",
    aliases: ["emo5", "nat13", "asco", "m13"],
    name: "Asco",
    level: "intermediate",
    component: MandalaAsco,
    colors: [
      { id: "1", hex: "#81C784" },
      { id: "2", hex: "#A5D6A7" },
      { id: "3", hex: "#2E7D32" },
      { id: "4", hex: "#F48FB1" },
    ],
    solution: {
      b0: "2",
      b60: "2",
      b120: "2",
      b180: "2",
      b240: "2",
      b300: "2",
      face: "1",
      eyeL: "3",
      eyeR: "3",
      mouth: "3",
      tongue: "4",
    },
  },
  {
    id: "emo6",
    aliases: ["emo6", "nat14", "sorpresa", "m14"],
    name: "Sorpresa",
    level: "intermediate",
    component: MandalaSorpresa,
    colors: [
      { id: "1", hex: "#BA68C8" },
      { id: "2", hex: "#FFECB3" },
      { id: "3", hex: "#FFFFFF" },
      { id: "4", hex: "#6A1B9A" },
    ],
    solution: {
      bg: "1",
      face: "2",
      browL: "4",
      browR: "4",
      eyeL: "3",
      eyeR: "3",
      mouth: "3",
    },
  },
  {
    id: "emo7",
    aliases: ["emo7", "nat15", "peso", "culpa", "m15"],
    name: "Peso",
    level: "intermediate",
    component: MandalaCulpa,
    colors: [
      { id: "1", hex: "#9CA3AF" },
      { id: "2", hex: "#F5F5F5" },
      { id: "3", hex: "#4B5563" },
      { id: "4", hex: "#111827" },
    ],
    solution: {
      chain0: "1",
      chain1: "1",
      chain2: "1",
      chain3: "1",
      chain4: "1",
      chain5: "1",
      chain6: "1",
      chain7: "1",
      bg: "1",
      face: "2",
      browL: "3",
      browR: "3",
      eyeL: "3",
      eyeR: "3",
      pupilL: "4",
      pupilR: "4",
      mouth: "3",
      handL: "2",
      handR: "2",
    },
  },
  {
    id: "emo8",
    aliases: ["emo8", "nat16", "rubor", "verguenza", "m16"],
    name: "Rubor",
    level: "intermediate",
    component: MandalaVerguenza,
    colors: [
      { id: "1", hex: "#F8BBD0" },
      { id: "2", hex: "#F06292" },
      { id: "3", hex: "#64B5F6" },
      { id: "4", hex: "#374151" },
    ],
    solution: {
      ray0: "3",
      ray1: "3",
      ray2: "3",
      ray3: "3",
      ray4: "3",
      ray5: "3",
      ray6: "3",
      ray7: "3",
      ray8: "3",
      ray9: "3",
      ray10: "3",
      ray11: "3",
      face: "1",
      eyeL: "4",
      eyeR: "4",
      cheekL: "2",
      cheekR: "2",
      mouth: "4",
      sweat1: "3",
      sweat2: "3",
      sweat3: "3",
      sweat4: "3",
    },
  },
  {
    id: "geo1",
    aliases: ["geo1", "nat17", "hexagonos", "m17"],
    name: "Hexagonos",
    level: "advanced",
    component: MandalaGeo1,
    colors: [
      { id: "1", hex: "#1E3A8A" },
      { id: "2", hex: "#3B82F6" },
      { id: "3", hex: "#60A5FA" },
      { id: "4", hex: "#93C5FD" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "3",
      p4: "2",
      p5: "3",
      p6: "2",
      p7: "3",
      p8: "4",
      p9: "4",
      p10: "4",
      p11: "4",
      p12: "4",
      p13: "4",
    },
  },
  {
    id: "geo2",
    aliases: ["geo2", "nat18", "masaico", "mosaico", "m18"],
    name: "Masaico",
    level: "advanced",
    component: MandalaGeo2,
    colors: [
      { id: "1", hex: "#14532D" },
      { id: "2", hex: "#22C55E" },
      { id: "3", hex: "#86EFAC" },
      { id: "4", hex: "#DCFCE7" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "2",
      p4: "2",
      p5: "2",
      p6: "3",
      p7: "3",
      p8: "3",
      p9: "3",
    },
  },
  {
    id: "geo3",
    aliases: ["geo3", "nat19", "constelacion", "m19"],
    name: "Constelacion",
    level: "advanced",
    component: MandalaGeo3,
    colors: [
      { id: "1", hex: "#4C1D95" },
      { id: "2", hex: "#7C3AED" },
      { id: "3", hex: "#A78BFA" },
      { id: "4", hex: "#DDD6FE" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "3",
      p4: "4",
    },
  },
  {
    id: "geo4",
    aliases: ["geo4", "nat20", "galaxia", "m20"],
    name: "Galaxia",
    level: "advanced",
    component: MandalaGeo4,
    colors: [
      { id: "1", hex: "#0F172A" },
      { id: "2", hex: "#1D4ED8" },
      { id: "3", hex: "#9333EA" },
      { id: "4", hex: "#EC4899" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "3",
      p4: "2",
      p5: "3",
      p6: "2",
      p7: "3",
      p8: "4",
      p9: "4",
      p10: "4",
      p11: "4",
      p12: "4",
      p13: "4",
    },
  },
  {
    id: "geo5",
    aliases: ["geo5", "nat21", "laberinto", "m21"],
    name: "Laberinto",
    level: "advanced",
    component: MandalaGeo5,
    colors: [
      { id: "1", hex: "#7C2D12" },
      { id: "2", hex: "#EA580C" },
      { id: "3", hex: "#FB923C" },
      { id: "4", hex: "#FFEDD5" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "2",
      p4: "2",
      p5: "2",
      p6: "3",
      p7: "3",
      p8: "3",
      p9: "3",
      p10: "4",
      p11: "4",
      p12: "4",
      p13: "4",
    },
  },
  {
    id: "geo6",
    aliases: ["geo6", "nat22", "corona", "m22"],
    name: "Corona",
    level: "advanced",
    component: MandalaGeo6,
    colors: [
      { id: "1", hex: "#F59E0B" },
      { id: "2", hex: "#FBBF24" },
      { id: "3", hex: "#FCD34D" },
      { id: "4", hex: "#78350F" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "3",
      p4: "2",
      p5: "3",
      p6: "2",
      p7: "3",
    },
  },
  {
    id: "geo7",
    aliases: ["geo7", "nat23", "jardin", "m23"],
    name: "Jardin",
    level: "advanced",
    component: MandalaGeo7,
    colors: [
      { id: "1", hex: "#14532D" },
      { id: "2", hex: "#22C55E" },
      { id: "3", hex: "#86EFAC" },
      { id: "4", hex: "#FDE68A" },
    ],
    solution: {
      p1: "4",
      p2: "2",
      p3: "2",
      p4: "2",
      p5: "2",
      p6: "3",
      p7: "3",
      p8: "3",
      p9: "3",
    },
  },
  {
    id: "geo8",
    aliases: ["geo8", "nat24", "octagonal", "mandala-octagonal", "m24"],
    name: "Mandala octagonal",
    level: "advanced",
    component: MandalaGeo8,
    colors: [
      { id: "1", hex: "#0F766E" },
      { id: "2", hex: "#14B8A6" },
      { id: "3", hex: "#5EEAD4" },
      { id: "4", hex: "#CCFBF1" },
    ],
    solution: {
      p1: "1",
      p2: "2",
      p3: "3",
      p4: "2",
      p5: "3",
      p6: "2",
      p7: "3",
      p8: "2",
      p9: "3",
      p10: "4",
      p11: "2",
      p12: "3",
      p13: "2",
      p14: "3",
    },
  },
];

const MANDALA_ALIAS_TO_ID: Record<string, string> = BASE_MANDALAS.reduce(
  (acc, mandala) => {
    mandala.aliases.forEach((alias) => {
      acc[alias.toLowerCase()] = mandala.id;
    });
    return acc;
  },
  {} as Record<string, string>,
);

const resolveMandalaIds = (ids: string[]): string[] => {
  const resolved = ids
    .map((id) => MANDALA_ALIAS_TO_ID[id.toLowerCase()])
    .filter((id): id is string => Boolean(id));

  return Array.from(new Set(resolved));
};

const Home: React.FC<PlayProps> = ({ difficulty = "basic" }) => {
  const [showStartScreen, setShowStartScreen] = useState<boolean>(true);
  const [appNombreJuego, setAppNombreJuego] = useState<string>("STEAM-G");
  const [difficultyConfig, setDifficultyConfig] =
    useState<Difficulty>(difficulty);
  const [showInformation, setShowInformation] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(5);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const [appDescripcion, setAppDescripcion] = useState<string>(
    "Juego para el desarrollo de habilidades matematicas",
  );
  const [appFecha, setAppFecha] = useState<string>("2 de diciembre del 2025");
  const [appVersion, setAppVersion] = useState<string>("1.0");
  const [appPlataformas, setAppPlataformas] = useState<string>("android");
  const [appAutor, setAppAutor] = useState<string>("Valeria C. Z.");
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [puntuacionTotal, setPuntuacionTotal] = useState(0);
  const [selectedMandalas, setSelectedMandalas] = useState<string[]>([]);
  const [currentMandalaIndex, setCurrentMandalaIndex] = useState(0);
  const [fillState, setFillState] = useState<FillState>({});
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);

  const [mandalasConfig, setMandalasConfig] = useState<{
    basico: string[];
    intermedio: string[];
    avanzado: string[];
  }>({
    basico: DEFAULT_MANDALAS_BY_LEVEL.basic,
    intermedio: DEFAULT_MANDALAS_BY_LEVEL.intermediate,
    avanzado: DEFAULT_MANDALAS_BY_LEVEL.advanced,
  });

  const feedbackTimeoutRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  const mandalasById = useMemo(
    () =>
      BASE_MANDALAS.reduce(
        (acc, mandala) => {
          acc[mandala.id] = {
            ...mandala,
            colors: mandala.colors,
          };
          return acc;
        },
        {} as Record<string, MandalaDefinition>,
      ),
    [],
  );

  const getDifficultySettings = (diff: Difficulty): GameSettings => {
    const baseSettings: Record<
      Difficulty,
      { maxMandalas: number; time: number }
    > = {
      basic: { maxMandalas: 3, time: 300 },
      intermediate: { maxMandalas: 4, time: 600 },
      advanced: { maxMandalas: 5, time: 900 },
    };

    const mandalaMap: Record<Difficulty, keyof typeof mandalasConfig> = {
      basic: "basico",
      intermediate: "intermedio",
      advanced: "avanzado",
    };

    return {
      ...baseSettings[diff],
      mandalasAvailable: mandalasConfig[mandalaMap[diff]],
    };
  };

  const currentSettings = getDifficultySettings(difficultyConfig);
  const currentMandalaId = selectedMandalas[currentMandalaIndex] ?? null;
  const currentMandala = currentMandalaId
    ? mandalasById[currentMandalaId]
    : null;
  const CurrentMandalaComponent = currentMandala?.component ?? null;
  const paletteColors = useMemo(
    () => currentMandala?.colors ?? [],
    [currentMandala],
  );

  const selectedColor = useMemo(() => {
    if (!selectedColorId) return null;
    return paletteColors.find((color) => color.id === selectedColorId) ?? null;
  }, [paletteColors, selectedColorId]);

  const numeroEjercicios = useMemo(() => {
    const ids = resolveMandalaIds(currentSettings.mandalasAvailable);
    return ids.length;
  }, [currentSettings.mandalasAvailable]);

  useEffect(() => {
    const cargarConfig = async () => {
      try {
        const res = await fetch("/config/mandala-config.json");

        if (!res.ok) {
          return;
        }

        const data: MandalaRuntimeConfig = await res.json();

        if (data.nivel) {
          setDifficultyConfig(normalizarNivelConfig(data.nivel));
        }

        if (data.autor) setAppAutor(data.autor);
        if (data.version) setAppVersion(data.version);
        if (data.fecha) setAppFecha(formatearFechaLarga(data.fecha));
        if (data.descripcion) setAppDescripcion(data.descripcion);
        if (data.plataformas) setAppPlataformas(data.plataformas.join(", "));
        if (data.nombreApp) setAppNombreJuego(data.nombreApp);

        if (data.mandalasDisponibles) {
          setMandalasConfig((prev) => ({
            basico: data.mandalasDisponibles?.basico || prev.basico,
            intermedio: data.mandalasDisponibles?.intermedio || prev.intermedio,
            avanzado: data.mandalasDisponibles?.avanzado || prev.avanzado,
          }));
        }
      } catch (err) {
        console.error("No se pudo cargar mandala-config.json", err);
      }
    };

    cargarConfig();
  }, []);

  useEffect(() => {
    if (!showCountdown || countdown <= 0) return;

    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, showCountdown]);

  useEffect(() => {
    if (!showCountdown || countdown !== 0) return;

    const timer = window.setTimeout(() => {
      setShowCountdown(false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [countdown, showCountdown]);

  useEffect(() => {
    if (showStartScreen || showCountdown || showSummary || isPaused) {
      return;
    }

    const timerId = window.setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          setFeedbackMessage("Tiempo agotado");
          setShowFeedback(true);

          const isLast = currentMandalaIndex >= selectedMandalas.length - 1;

          const timeoutId = window.setTimeout(() => {
            setShowFeedback(false);
            if (isLast) {
              setShowSummary(true);
            } else {
              setCurrentMandalaIndex((i) => i + 1);
              setTiempoRestante(currentSettings.time);
            }
          }, 1200);

          if (transitionTimeoutRef.current) {
            window.clearTimeout(transitionTimeoutRef.current);
          }
          transitionTimeoutRef.current = timeoutId;

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [showStartScreen, showCountdown, showSummary, isPaused, currentMandalaIndex, selectedMandalas.length, currentSettings.time]);

  useEffect(() => {
    if (!currentMandalaId) {
      setFillState({});
      setSelectedColorId(null);
      return;
    }

    const mandala = mandalasById[currentMandalaId];
    setFillState({});
    setSelectedColorId(mandala?.colors[0]?.id ?? null);
  }, [currentMandalaId, mandalasById]);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const getDifficultyLabel = (nivel: Difficulty): string => {
    const labels: Record<Difficulty, string> = {
      basic: "Basico",
      intermediate: "Intermedio",
      advanced: "Avanzado",
    };

    return labels[nivel] ?? nivel;
  };

  const generarConfeti = (cantidad = 60): ConfettiPiece[] => {
    const colores = ["#ff6b6b", "#feca57", "#48dbfb", "#1dd1a1", "#5f27cd"];

    return Array.from({ length: cantidad }, (_, id) => ({
      id,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 2.5 + Math.random() * 2.5,
      color: colores[Math.floor(Math.random() * colores.length)],
    }));
  };

  const formatPlataforma = (texto: string): string => {
    const mapa: Record<string, string> = {
      android: "Android",
      ios: "iOS",
      web: "Web",
    };

    return texto
      .split(/,\s*/)
      .map((plataforma) => {
        const limpio = plataforma.trim();
        if (!limpio) return limpio;
        return (
          mapa[limpio.toLowerCase()] ??
          limpio.charAt(0).toUpperCase() + limpio.slice(1)
        );
      })
      .filter(Boolean)
      .join(", ");
  };

  const normalizarNivelConfig = (nivel: string): Difficulty => {
    const limpio = nivel.toLowerCase();
    const mapa: Record<string, Difficulty> = {
      basico: "basic",
      basic: "basic",
      intermedio: "intermediate",
      intermediate: "intermediate",
      avanzado: "advanced",
      advanced: "advanced",
    };

    return mapa[limpio] ?? "basic";
  };

  const formatearFechaLarga = (isoDate?: string) => {
    if (!isoDate) return appFecha;

    const [year, month, day] = isoDate.split("-");
    const meses = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    const mesIndex = Number(month) - 1;
    if (mesIndex < 0 || mesIndex > 11) return isoDate;

    return `${Number(day)} de ${meses[mesIndex]} del ${year}`;
  };

  const showFeedbackMessage = (message: string, duration = 1300) => {
    setFeedbackMessage(message);
    setShowFeedback(true);

    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setShowFeedback(false);
      feedbackTimeoutRef.current = null;
    }, duration);
  };

  const queueAdvance = (toSummary: boolean) => {
    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
      if (toSummary) {
        setShowSummary(true);
      } else {
        setCurrentMandalaIndex((prev) => prev + 1);
      }
      transitionTimeoutRef.current = null;
    }, 900);
  };

  const handleExitApp = async () => {
    try {
      await App.exitApp();
    } catch {
      window.close();
    }
  };

  const resetGame = () => {
    setCountdown(5);
    setShowCountdown(true);
    setShowSummary(false);
    setShowFeedback(false);
    setIsPaused(false);
    setCurrentMandalaIndex(0);
    setPuntuacionTotal(0);
    setTiempoRestante(currentSettings.time);
    setFillState({});
    setSelectedColorId(null);
  };

  const handleStartGame = () => {
    const mandalasConfiguradas = resolveMandalaIds(
      currentSettings.mandalasAvailable,
    ).filter((id) => mandalasById[id]?.level === difficultyConfig);
    const fallbackPorDefecto = resolveMandalaIds(
      DEFAULT_MANDALAS_BY_LEVEL[difficultyConfig],
    ).filter((id) => mandalasById[id]?.level === difficultyConfig);
    const mandalasDelNivel =
      mandalasConfiguradas.length > 0
        ? mandalasConfiguradas
        : fallbackPorDefecto;

    setSelectedMandalas(mandalasDelNivel);
    setShowStartScreen(false);
    resetGame();
  };

  const handleInformation = () => {
    setShowInformation((prev) => !prev);
  };

  const handlePausar = () => {
    if (
      showStartScreen ||
      showCountdown ||
      showSummary ||
      showInstructions ||
      showFeedback
    ) {
      return;
    }

    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleExitToStart = () => {
    setIsPaused(false);
    setShowCountdown(false);
    setShowInstructions(false);
    setShowSummary(false);
    setShowFeedback(false);
    setSelectedMandalas([]);
    setCurrentMandalaIndex(0);
    setPuntuacionTotal(0);
    setShowStartScreen(true);
    setFillState({});
    setSelectedColorId(null);
    setTiempoRestante(currentSettings.time);
  };

  const handleSalirDesdePausa = () => {
    handleExitToStart();
  };

  const handleFill = (id: string) => {
    if (showCountdown || showSummary || isPaused || !currentMandala) return;

    if (!selectedColor) {
      showFeedbackMessage("Selecciona un color de la paleta", 1000);
      return;
    }

    setFillState((prev) => ({
      ...prev,
      [id]: selectedColor.hex,
    }));
  };

  const handleVerifyMandala = () => {
    if (!currentMandala) return;

    const requiredIds = Object.keys(currentMandala.solution);
    const isComplete = requiredIds.every((id) => Boolean(fillState[id]));

    if (!isComplete) {
      showFeedbackMessage(
        "Debes colorear todas las areas antes de verificar",
        1300,
      );
      return;
    }

    const colorMap = currentMandala.colors.reduce(
      (acc, color) => {
        acc[color.id] = normalizeHex(color.hex);
        return acc;
      },
      {} as Record<string, string>,
    );

    const isCorrect = requiredIds.every((id) => {
      const expectedColor = colorMap[currentMandala.solution[id]];
      const currentColor = normalizeHex(fillState[id]);
      return expectedColor === currentColor;
    });

    if (!isCorrect) {
      showFeedbackMessage(
        "Algunos colores no coinciden. Intenta de nuevo",
        1400,
      );
      return;
    }

    setPuntuacionTotal((prev) => prev + 10);
    showFeedbackMessage("Correcto! +10 puntos", 900);

    const isLastMandala = currentMandalaIndex >= selectedMandalas.length - 1;
    queueAdvance(isLastMandala);
  };

  const handleFinishGame = () => {
    setIsPaused(false);
    setShowSummary(true);
  };

  const formatearTiempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = Math.max(0, segundos % 60);
    return `${minutos}:${segs.toString().padStart(2, "0")}`;
  };

  return (
    <IonPage>
      {showCountdown && countdown > 0 && (
        <div className="countdown-overlay">
          <div className="countdown-number">{countdown}</div>
        </div>
      )}

      {showFeedback && (
        <div className="feedback-overlay">
          <div className="feedback-text">{feedbackMessage}</div>
        </div>
      )}

      {showSummary && (
        <div className="summary-overlay">
          <div className="summary-message">
            {(() => {
              const total = selectedMandalas.length;
              const correctas = Math.floor(puntuacionTotal / 10);
              const porcentaje =
                total > 0 ? Math.round((correctas / total) * 100) : 0;
              const etiqueta =
                correctas === total
                  ? "PERFECTO"
                  : porcentaje >= 70
                    ? "Excelente"
                    : porcentaje >= 50
                      ? "Buen trabajo"
                      : "Sigue practicando";

              return (
                <>
                  <h2>Juego Terminado</h2>

                  <div className="resumen-final">
                    <h3>Resultados Finales</h3>

                    <p>
                      <strong>Mandalas completados:</strong> {correctas} /{" "}
                      {total}
                    </p>
                    <p>
                      <strong>Puntuación total:</strong> {puntuacionTotal} /{" "}
                      {total * 10}
                    </p>

                    <IonBadge className="badge">{etiqueta}</IonBadge>
                  </div>

                  <IonButton
                    id="finalize"
                    expand="block"
                    onClick={handleSalirDesdePausa}
                  >
                    <IonIcon icon={refresh} slot="start" />
                    Jugar de nuevo
                  </IonButton>

                  <IonButton id="exit" expand="block" onClick={handleExitApp}>
                    <IonIcon slot="start" icon={exitOutline}></IonIcon>
                    Cerrar aplicacion
                  </IonButton>
                </>
              );
            })()}
          </div>

          <div className="confetti-container">
            {generarConfeti().map((c) => (
              <div
                key={c.id}
                className="confetti"
                style={{
                  left: `${c.left}%`,
                  animationDelay: `${c.delay}s`,
                  animationDuration: `${c.duration}s`,
                  backgroundColor: c.color,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="ins-overlay" onClick={() => setShowInstructions(false)}>
          <div className="ins-card" onClick={(e) => e.stopPropagation()}>
            <div className="ins-title">
              <h2
                style={{ margin: 0, fontWeight: "bold", color: "var(--dark)" }}
              >
                Reglas Básicas
              </h2>
              <IonIcon
                icon={closeCircleOutline}
                style={{ fontSize: "26px", color: "var(--dark)" }}
                onClick={() => setShowInstructions(false)}
              />
            </div>

            <div className="ins-stats">
              <p style={{ textAlign: "justify" }}>
                <strong>
                  Colorea las áreas correspondientes siguiendo el número indicado.
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {showInformation && (
        <div className="info-modal-background">
          <div className="info-modal">
            <div className="header">
              <h2 style={{ color: "var(--color-primary)", fontWeight: "bold" }}>
                {appNombreJuego}
              </h2>
              <p
                style={{
                  color: "#8b8b8bff",
                  marginTop: "5px",
                  textAlign: "center",
                }}
              >
                Actividad configurada desde la plataforma Steam-G
              </p>
            </div>
            <div className="cards-info">
              <div className="card">
                <p className="title">VERSION</p>
                <p className="data">{appVersion}</p>
              </div>
              <div className="card">
                <p className="title">FECHA DE CREACION</p>
                <p className="data">{appFecha}</p>
              </div>
              <div className="card">
                <p className="title">PLATAFORMAS</p>
                <p className="data">{formatPlataforma(appPlataformas)}</p>
              </div>
              <div className="card">
                <p className="title">NÚMERO DE EJERCICIOS</p>
                <p className="data">
                  {numeroEjercicios || "Sin configuracion"}
                </p>
              </div>
              <div className="card description">
                <p className="title">DESCRIPCION</p>
                <p className="data">{appDescripcion}</p>
              </div>
            </div>
            <div className="button">
              <IonButton expand="full" onClick={handleInformation}>
                Cerrar
              </IonButton>
            </div>
          </div>
        </div>
      )}

      {isPaused && (
        <div className="pause-overlay">
          <div className="pause-card">
            <h2>Juego en pausa</h2>
            <p>El tiempo esta detenido.</p>

            <IonButton
              expand="block"
              id="resume"
              style={{ marginTop: "16px" }}
              onClick={handleResume}
            >
              <IonIcon slot="start" icon={playCircleOutline}></IonIcon>
              Reanudar
            </IonButton>

            <IonButton
              expand="block"
              id="finalize"
              style={{ marginTop: "10px" }}
              onClick={handleSalirDesdePausa}
            >
              <IonIcon slot="start" icon={homeOutline}></IonIcon>
              Finalizar juego
            </IonButton>

            <IonButton
              expand="block"
              id="exit"
              style={{ marginTop: "10px" }}
              onClick={handleExitApp}
            >
              <IonIcon slot="start" icon={exitOutline}></IonIcon>
              Cerrar aplicacion
            </IonButton>
          </div>
        </div>
      )}

      <IonContent fullscreen className="ion-padding">
        {showStartScreen ? (
          <div className="inicio-container">
            <div className="header-game ion-no-border">
              <div className="toolbar-game">
                <div className="titles start-page">
                  <h1>{appNombreJuego}</h1>
                </div>
              </div>
            </div>

            <div className="info-juego">
              <div className="info-item">
                <IonChip>
                  <strong>Nivel: {getDifficultyLabel(difficultyConfig)}</strong>
                </IonChip>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              className="page-start-btns"
            >
              <IonButton onClick={handleStartGame} className="play">
                <IonIcon slot="start" icon={playCircleOutline}></IonIcon>
                Iniciar juego
              </IonButton>
              <IonButton onClick={handleInformation} className="info">
                <IonIcon slot="start" icon={informationCircleOutline}></IonIcon>
                Informacion
              </IonButton>
            </div>
          </div>
        ) : (
          <>
            <div className="header-game ion-no-border">
              <div className="toolbar-game">
                <div className="titles">
                  <h1>STEAM-G</h1>
                  <IonIcon
                    icon={alertCircleOutline}
                    size="small"
                    id="info-icon"
                  />
                  <IonPopover
                    trigger="info-icon"
                    side="bottom"
                    alignment="center"
                  >
                    <IonCard className="filter-card ion-no-margin">
                      <div className="section header-section">
                        <h2>{appNombreJuego}</h2>
                      </div>

                      <div className="section description-section">
                        <p>{appDescripcion}</p>
                      </div>

                      <div className="section footer-section">
                        <span>{appFecha}</span>
                      </div>
                    </IonCard>
                  </IonPopover>
                </div>
                <span>
                  <strong>{appNombreJuego}</strong>
                </span>
              </div>
            </div>

            <div className="instructions-exercises">
              <div className="num-words">
                <strong>
                  Juego{" "}
                  {Math.min(currentMandalaIndex + 1, selectedMandalas.length)}{" "}
                  de {selectedMandalas.length}
                </strong>
              </div>

              <div className="temporizador">
                <IonIcon icon={time} className="icono-tiempo" />
                <h5 className="tiempo-display">
                  {formatearTiempo(tiempoRestante)}
                </h5>
              </div>

              <div className="num-words">
                <strong>Puntuación: {puntuacionTotal}</strong>
              </div>

              <div className="rules" onClick={() => setShowInstructions(true)}>
                Reglas Básicas
              </div>
            </div>

            <div className="videogame">
              <div className="mandala-canvas-container">
                <svg
                  viewBox="0 0 500 500"
                  className="mandala-svg"
                  role="img"
                  aria-label={`Mandala ${currentMandala?.name}`}
                >
                  {CurrentMandalaComponent && (
                    <CurrentMandalaComponent
                      fillState={fillState}
                      onFill={handleFill}
                      solution={currentMandala?.solution ?? {}}
                      showNumbers
                    />
                  )}
                </svg>
              </div>

              <div className="color-palette-container">
                <h3 className="palette-title">Paleta de colores</h3>

                <div className="color-grid">
                  {paletteColors.map((color) => {
                    const isSelected = selectedColorId === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        className={`color-button ${isSelected ? "selected" : ""}`}
                        style={{
                          backgroundColor: color.hex,
                          color: getContrastColor(color.hex),
                          border: `0.1px solid var(--dark)`,
                        }}
                        onClick={() => setSelectedColorId(color.id)}
                      >
                        <span className="color-number">{color.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="button game">
              <IonButton
                shape="round"
                expand="full"
                onClick={handleVerifyMandala}
                disabled={
                  showCountdown || showFeedback || showSummary || isPaused
                }
              >
                Verificar
              </IonButton>
              <IonButton
                shape="round"
                expand="full"
                onClick={handlePausar}
                disabled={
                  showCountdown ||
                  showFeedback ||
                  showSummary ||
                  showInstructions ||
                  isPaused
                }
              >
                <IonIcon slot="start" icon={pauseCircleOutline} />
                Pausar
              </IonButton>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Home;
