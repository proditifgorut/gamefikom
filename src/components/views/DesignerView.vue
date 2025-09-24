<template>
  <div class="relative w-full h-full min-h-[80vh] overflow-auto" ref="containerRef">
    <div v-if="!dbDetails" class="text-center p-8">Loading Designer...</div>
    
    <!-- Nodes -->
    <div 
      v-for="node in nodes" 
      :key="node.id"
      :ref="el => tableNodeRefs[node.id] = el"
      class="absolute"
      :style="{ left: `${node.x}px`, top: `${node.y}px` }"
    >
      <TableNode :table="node.table" />
    </div>

    <!-- Edges -->
    <svg class="absolute top-0 left-0 w-full h-full pointer-events-none" :style="{ width: `${svgDimensions.width}px`, height: `${svgDimensions.height}px` }">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
        </marker>
        <marker id="circle" markerWidth="8" markerHeight="8" refX="4" refY="4">
          <circle cx="4" cy="4" r="3" fill="#9ca3af" />
        </marker>
      </defs>
      <path
        v-for="(edge, index) in edges"
        :key="index"
        :d="edge.path"
        stroke="#9ca3af"
        stroke-width="2"
        fill="none"
        marker-end="url(#arrowhead)"
        marker-start="url(#circle)"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, ComponentPublicInstance } from 'vue';
import { reactiveMockServer } from '../../services/apiService';
import TableNode from '../nodes/TableNode.vue';
import type { TableDetails } from '../../types';

interface Node {
  id: string;
  table: TableDetails;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Edge {
  from: string;
  to: string;
  path: string;
}

const props = defineProps<{
  database: string;
}>();

const containerRef = ref<HTMLElement | null>(null);
const tableNodeRefs = ref<Record<string, Element | ComponentPublicInstance | null>>({});

const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const svgDimensions = ref({ width: 0, height: 0 });

const dbDetails = computed(() => reactiveMockServer.value[props.database]);

const calculateLayout = async () => {
  if (!dbDetails.value || !containerRef.value) return;

  const tableEntries = Object.values(dbDetails.value);
  const nodeWidth = 200;
  const nodeHeight = 150; // Estimate
  const gapX = 100;
  const gapY = 50;
  const cols = Math.floor(containerRef.value.clientWidth / (nodeWidth + gapX)) || 3;

  nodes.value = tableEntries.map((table, i) => ({
    id: table.name,
    table,
    x: (i % cols) * (nodeWidth + gapX) + 20,
    y: Math.floor(i / cols) * (nodeHeight + gapY) + 20,
    width: nodeWidth,
    height: nodeHeight,
  }));

  await nextTick();
  calculateEdges();
};

const calculateEdges = () => {
  if (nodes.value.length === 0) return;

  const newEdges: Edge[] = [];
  let maxWidth = 0;
  let maxHeight = 0;

  // Update node dimensions
  nodes.value.forEach(node => {
    const el = tableNodeRefs.value[node.id] as ComponentPublicInstance;
    if (el && el.$el) {
      node.width = el.$el.offsetWidth;
      node.height = el.$el.offsetHeight;
    }
    maxWidth = Math.max(maxWidth, node.x + node.width);
    maxHeight = Math.max(maxHeight, node.y + node.height);
  });
  svgDimensions.value = { width: maxWidth + 50, height: maxHeight + 50 };

  const nodeMap = new Map(nodes.value.map(n => [n.id, n]));

  nodes.value.forEach(node => {
    node.table.schema.forEach(col => {
      if (col.references) {
        const fromNode = nodeMap.get(node.id);
        const toNode = nodeMap.get(col.references.table);

        if (fromNode && toNode) {
          const startX = fromNode.x + fromNode.width;
          const startY = fromNode.y + fromNode.height / 2;
          const endX = toNode.x;
          const endY = toNode.y + toNode.height / 2;
          
          const midX = startX + (endX - startX) / 2;
          
          newEdges.push({
            from: node.id,
            to: col.references.table,
            path: `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`
          });
        }
      }
    });
  });
  edges.value = newEdges;
};

watch(() => props.database, () => {
  calculateLayout();
}, { immediate: true });

onMounted(() => {
  calculateLayout();
  window.addEventListener('resize', calculateLayout);
});
</script>
