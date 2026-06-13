import { loadElk } from "./elk-loader.js";
import { buildDisplayStoryGraph, isSceneFlowNode } from "./story-flowchart.js";

const FLOW_NODE_METRICS = {
  cardWidth: 132,
  choiceMinWidth: 132,
  cardHeight: 60,
  choiceHeight: 28,
  labelGap: 6,
  labelHeight: 16,
  startTagHeight: 0,
};

const MOBILE_BREAKPOINT = 640;
const LAYOUT_VERSION = 7;

/** @typedef {"RIGHT"|"DOWN"} FlowchartLayoutDirection */

/**
 * @param {import("./story-flowchart.js").FlowNode} node
 */
function getElkNodeSize(node) {
  const { cardWidth, cardHeight, labelGap, labelHeight, startTagHeight } = FLOW_NODE_METRICS;
  const tag = node.type === "start" ? startTagHeight : 0;
  return {
    width: cardWidth,
    height: cardHeight + labelGap + labelHeight + tag,
  };
}

/**
 * @typedef {object} StoryFlowchartLayout
 * @property {number} version
 * @property {FlowchartLayoutDirection} direction
 * @property {import("./story-flowchart.js").FlowNode[]} nodes
 * @property {Array<{ from: string, to: string }>} edges
 * @property {number} width
 * @property {number} height
 */

/** @type {Map<string, StoryFlowchartLayout>} */
const layoutCache = new Map();

/** @type {Promise<StoryFlowchartLayout>|null} */
let layoutPromise = null;

export function isVerticalFlowchartLayout() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

/** @returns {FlowchartLayoutDirection} */
export function getFlowchartLayoutDirection() {
  return isVerticalFlowchartLayout() ? "DOWN" : "RIGHT";
}

export function clearStoryFlowchartLayoutCache() {
  layoutCache.clear();
  layoutPromise = null;
}

/**
 * @param {FlowchartLayoutDirection} direction
 * @returns {Promise<StoryFlowchartLayout>}
 */
async function computeLayout(direction) {
  const { nodes, edges } = buildDisplayStoryGraph();
  const elk = await loadElk();
  const vertical = direction === "DOWN";

  const elkGraph = {
    id: "story-root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": direction,
      "elk.spacing.nodeNode": vertical ? "14" : "10",
      "elk.layered.spacing.nodeNodeBetweenLayers": vertical ? "52" : "76",
      "elk.layered.spacing.edgeNodeBetweenLayers": vertical ? "28" : "36",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "elk.layered.compaction.connectedComponents": "true",
      "elk.padding": vertical ? "[top=24,left=20,bottom=24,right=20]" : "[top=20,left=40,bottom=20,right=40]",
    },
    children: nodes.filter(isSceneFlowNode).map((node) => {
      const size = getElkNodeSize(node);
      return {
        id: node.id,
        width: size.width,
        height: size.height,
      };
    }),
    edges: edges.map((edge, index) => ({
      id: `edge-${index}`,
      sources: [edge.from],
      targets: [edge.to],
    })),
  };

  const layout = await elk.layout(elkGraph);
  const layoutById = new Map((layout.children ?? []).map((child) => [child.id, child]));

  let positionedNodes = nodes.map((node) => {
    const placed = layoutById.get(node.id);
    return {
      ...node,
      x: placed?.x ?? node.x,
      y: placed?.y ?? node.y,
    };
  });

  let layoutWidth = Math.ceil((layout.width ?? 0) + (vertical ? 40 : 64));
  const layoutHeight = Math.ceil((layout.height ?? 0) + (vertical ? 48 : 40));

  if (vertical) {
    const placedSceneNodes = positionedNodes.filter(isSceneFlowNode);
    const bounds = placedSceneNodes.map((node) => {
      const size = getElkNodeSize(node);
      return { minX: node.x, maxX: node.x + size.width };
    });

    if (bounds.length) {
      const minX = Math.min(...bounds.map((item) => item.minX));
      const maxX = Math.max(...bounds.map((item) => item.maxX));
      const graphWidth = maxX - minX;
      const sidePad = 20;
      const targetWidth = Math.max(FLOW_NODE_METRICS.cardWidth + sidePad * 2, Math.ceil(graphWidth + sidePad * 2));
      const offsetX = Math.round((targetWidth - graphWidth) / 2 - minX);

      positionedNodes = positionedNodes.map((node) => ({
        ...node,
        x: isSceneFlowNode(node) ? node.x + offsetX : node.x,
      }));
      layoutWidth = targetWidth;
    }
  }

  return {
    version: LAYOUT_VERSION,
    direction,
    nodes: positionedNodes,
    edges,
    width: layoutWidth,
    height: layoutHeight,
  };
}

/** @returns {Promise<StoryFlowchartLayout>} */
export async function layoutStoryFlowchart() {
  const direction = getFlowchartLayoutDirection();
  const cacheKey = `${LAYOUT_VERSION}:${direction}`;
  const cached = layoutCache.get(cacheKey);
  if (cached) return cached;
  if (layoutPromise) return layoutPromise;

  layoutPromise = computeLayout(direction)
    .then((layout) => {
      layoutCache.set(cacheKey, layout);
      return layout;
    })
    .finally(() => {
      layoutPromise = null;
    });

  return layoutPromise;
}
