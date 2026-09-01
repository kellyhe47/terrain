#!/usr/bin/env python3
"""
Generate a valid .excalidraw file from a compact architecture spec.

Why this exists: agents reading a diagram can only recover its meaning if arrows
carry startBinding/endBinding and labels carry containerId. Hand-drawn diagrams
often lack both. This generator always emits them, so the output is readable by
both humans and agents.

Usage:
    python3 gen_diagram.py spec.json out.excalidraw

Spec format (JSON):
{
  "title": "Forge architecture",
  "nodes": [
    {"id": "gate",    "label": "SafetyGate\\n(deterministic)", "layer": 1, "group": "runtime", "accent": true},
    {"id": "planner", "label": "PlannerAgent\\n(LLM)",         "layer": 2, "group": "runtime"}
  ],
  "edges": [
    {"from": "gate", "to": "planner", "label": "safe set"}
  ],
  "groups": [ {"id": "runtime", "label": "Agentic runtime"} ]
}

- `layer` is the row (top-down). Nodes in a layer are spread horizontally.
- `group` is optional; draws a labelled container behind those nodes.
- `accent` is optional; highlights a node.
Output is deterministic: same spec in, byte-identical file out, so git diffs
reflect real changes rather than reshuffled seeds.
"""

import json
import sys
import zlib

# ── canvas geometry ────────────────────────────────────────────────────────────
NODE_W, NODE_H = 220, 88
GAP_X, GAP_Y = 70, 130
PAD = 34                     # padding around a group box
FONT_SIZE = 16
LINE_HEIGHT = 1.25
EDGE_FONT_SIZE = 12

INK = "#1e1e1e"
ACCENT = "#c2410c"
GROUP_INK = "#adb5bd"


def det(seed_src: str, lo: int = 1, hi: int = 2_000_000_000) -> int:
    """Deterministic pseudo-id so regeneration is byte-stable."""
    return lo + zlib.crc32(seed_src.encode()) % (hi - lo)


def eid(kind: str, key: str) -> str:
    return f"{kind}-{zlib.crc32(key.encode()):08x}"


def base(el_id: str, index: str, stroke: str = INK) -> dict:
    return {
        "id": el_id,
        "angle": 0,
        "strokeColor": stroke,
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "strokeStyle": "solid",
        "roughness": 1,
        "opacity": 100,
        "groupIds": [],
        "frameId": None,
        "index": index,
        "seed": det(el_id),
        "version": 1,
        "versionNonce": det(el_id + "n"),
        "isDeleted": False,
        "boundElements": None,
        "updated": 1,
        "link": None,
        "locked": False,
    }


def text_dims(label: str, size: int) -> tuple[int, int]:
    lines = label.split("\n")
    w = int(max(len(l) for l in lines) * size * 0.62) + 12
    h = int(len(lines) * size * LINE_HEIGHT) + 4
    return w, h


def build(spec: dict) -> dict:
    nodes = spec["nodes"]
    edges = spec.get("edges", [])
    group_meta = {g["id"]: g for g in spec.get("groups", [])}

    # ── layout: layers are rows, nodes spread across each row ──────────────────
    layers: dict[int, list] = {}
    for n in nodes:
        layers.setdefault(n.get("layer", 0), []).append(n)

    widest = max(len(v) for v in layers.values())
    canvas_w = widest * NODE_W + (widest - 1) * GAP_X

    pos: dict[str, tuple[int, int]] = {}
    for layer in sorted(layers):
        row = layers[layer]
        row_w = len(row) * NODE_W + (len(row) - 1) * GAP_X
        x0 = (canvas_w - row_w) // 2
        y = layer * (NODE_H + GAP_Y)
        for i, n in enumerate(row):
            pos[n["id"]] = (x0 + i * (NODE_W + GAP_X), y)

    elements: list[dict] = []
    order = iter(range(10_000))

    def nxt() -> str:
        return f"a{next(order):04d}"

    # ── group boxes first, so they render behind the nodes ────────────────────
    used_groups: dict[str, list[str]] = {}
    for n in nodes:
        if n.get("group"):
            used_groups.setdefault(n["group"], []).append(n["id"])

    # Frames are Excalidraw's native named-container primitive: the label lives on
    # the element as `name`, so it is recoverable rather than floating text.
    frame_of: dict[str, str] = {}
    for gid, members in used_groups.items():
        xs = [pos[m][0] for m in members]
        ys = [pos[m][1] for m in members]
        gx, gy = min(xs) - PAD, min(ys) - PAD
        gw = max(xs) + NODE_W + PAD - gx
        gh = max(ys) + NODE_H + PAD - gy
        fid = eid("frame", gid)
        frame = base(fid, nxt(), GROUP_INK)
        frame.update({
            "type": "frame", "x": gx, "y": gy, "width": gw, "height": gh,
            "roundness": None, "roughness": 0, "strokeWidth": 1,
            "name": group_meta.get(gid, {}).get("label", gid),
        })
        elements.append(frame)
        for m in members:
            frame_of[m] = fid

    # ── nodes: rectangle + text bound via containerId ─────────────────────────
    node_ids: dict[str, str] = {}
    for n in nodes:
        x, y = pos[n["id"]]
        rid = eid("rect", n["id"])
        tid = eid("text", n["id"])
        node_ids[n["id"]] = rid
        stroke = ACCENT if n.get("accent") else INK

        rect = base(rid, nxt(), stroke)
        rect.update({
            "type": "rectangle", "x": x, "y": y, "width": NODE_W, "height": NODE_H,
            "roundness": {"type": 3},
            "frameId": frame_of.get(n["id"]),
            "boundElements": [{"type": "text", "id": tid}],
        })
        elements.append(rect)

        label = n["label"]
        tw, th = text_dims(label, FONT_SIZE)
        txt = base(tid, nxt(), stroke)
        txt.update({
            "type": "text",
            "x": x + (NODE_W - tw) // 2, "y": y + (NODE_H - th) // 2,
            "width": tw, "height": th, "roundness": None,
            "text": label, "fontSize": FONT_SIZE, "fontFamily": 1,
            "textAlign": "center", "verticalAlign": "middle",
            "containerId": rid, "originalText": label,
            "frameId": frame_of.get(n["id"]),
            "autoResize": True, "lineHeight": LINE_HEIGHT,
        })
        elements.append(txt)

    # ── edges: arrows with real bindings on both ends ─────────────────────────
    by_id = {e["id"]: e for e in elements}
    for k, e in enumerate(edges):
        src, dst = e["from"], e["to"]
        if src not in pos or dst not in pos:
            raise SystemExit(f"edge {k}: unknown node id {src!r} -> {dst!r}")

        sx, sy = pos[src]
        dx, dy = pos[dst]
        x1, y1 = sx + NODE_W / 2, sy + NODE_H
        x2, y2 = dx + NODE_W / 2, dy

        aid = eid("arrow", f"{src}->{dst}-{k}")
        arrow = base(aid, nxt())
        arrow.update({
            "type": "arrow", "x": x1, "y": y1,
            "width": abs(x2 - x1), "height": abs(y2 - y1),
            "roundness": {"type": 2},
            "points": [[0, 0], [x2 - x1, y2 - y1]],
            "lastCommittedPoint": None,
            "startBinding": {"elementId": node_ids[src], "focus": 0, "gap": 4},
            "endBinding": {"elementId": node_ids[dst], "focus": 0, "gap": 4},
            "startArrowhead": None,
            "endArrowhead": "arrow",
            "elbowed": False,
        })

        if e.get("label"):
            lid = eid("arrowtext", f"{src}->{dst}-{k}")
            lw, lh = text_dims(e["label"], EDGE_FONT_SIZE)
            arrow["boundElements"] = [{"type": "text", "id": lid}]
            lbl = base(lid, nxt())
            lbl.update({
                "type": "text",
                "x": (x1 + x2) / 2 - lw / 2, "y": (y1 + y2) / 2 - lh / 2,
                "width": lw, "height": lh, "roundness": None,
                "text": e["label"], "fontSize": EDGE_FONT_SIZE, "fontFamily": 1,
                "textAlign": "center", "verticalAlign": "middle",
                "containerId": aid, "originalText": e["label"],
                "autoResize": True, "lineHeight": LINE_HEIGHT,
            })
            elements.append(arrow)
            elements.append(lbl)
        else:
            elements.append(arrow)

        # register the arrow on both endpoints, as the app does
        for nid in (node_ids[src], node_ids[dst]):
            be = by_id[nid].get("boundElements") or []
            be.append({"type": "arrow", "id": aid})
            by_id[nid]["boundElements"] = be

    return {
        "type": "excalidraw",
        "version": 2,
        "source": "product-inception/gen_diagram.py",
        "elements": elements,
        "appState": {"gridSize": 20, "viewBackgroundColor": "#ffffff"},
        "files": {},
    }


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: gen_diagram.py <spec.json> <out.excalidraw>")
    spec = json.load(open(sys.argv[1]))
    doc = build(spec)
    with open(sys.argv[2], "w") as f:
        json.dump(doc, f, indent=2, sort_keys=True)
        f.write("\n")
    n_nodes = len(spec["nodes"])
    n_edges = len(spec.get("edges", []))
    print(f"wrote {sys.argv[2]} — {n_nodes} nodes, {n_edges} edges, all bound")
