"""Minimal draw.io XML builder used by the APS diagram generator.

The builder writes one page per file.  Coordinates are in pixels; the page
size is chosen per diagram so the exported PNG keeps a landscape A3/A4 ratio.
"""

from __future__ import annotations

from pathlib import Path
from xml.sax.saxutils import escape, quoteattr

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "docs" / "diagramas" / "aps"

FONT = "fontFamily=Arial;fontSize=12;fontColor=#000000;"
TEXT = FONT + "text;html=1;whiteSpace=wrap;align=center;verticalAlign=middle;"
SMALL = "text;fontFamily=Arial;fontSize=10;fontColor=#000000;html=1;whiteSpace=wrap;align=center;verticalAlign=middle;"
TINY = "text;fontFamily=Arial;fontSize=9;fontColor=#000000;html=1;whiteSpace=wrap;align=center;verticalAlign=middle;"

BOX = FONT + "rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;"
ROUND = FONT + "rounded=1;arcSize=18;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;"
ELLIPSE = FONT + "ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;"
ACTOR = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fontFamily=Arial;fontSize=12;fontColor=#000000;"
ACTOR_TOP = "shape=umlActor;verticalLabelPosition=top;verticalAlign=bottom;html=1;fontFamily=Arial;fontSize=12;fontColor=#000000;"
DIAMOND = FONT + "rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;"
COMPONENT = "shape=component;align=center;verticalAlign=middle;whiteSpace=wrap;html=1;fontFamily=Arial;fontSize=12;fontColor=#000000;fillColor=#FFFFFF;strokeColor=#000000;spacingLeft=6;spacingRight=6;"
LIFELINE = "shape=umlLifeline;perimeter=lifelinePerimeter;whiteSpace=wrap;html=1;container=1;collapsible=0;recursiveResize=0;outlineConnect=0;fontFamily=Arial;fontSize=11;fontColor=#000000;fillColor=#FFFFFF;strokeColor=#000000;"
FRAME = "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;dashed=1;align=left;verticalAlign=top;spacingLeft=8;spacingTop=2;fontFamily=Arial;fontSize=10;fontColor=#000000;"
NOTE = "shape=note;whiteSpace=wrap;html=1;backgroundOutline=1;darkOpacity=0.05;fillColor=#FFFFFF;strokeColor=#000000;size=12;align=left;verticalAlign=top;spacingLeft=8;spacingTop=6;fontFamily=Arial;fontSize=10;fontColor=#000000;"
LANE = "rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;align=center;verticalAlign=top;spacingTop=6;fontFamily=Arial;fontSize=12;fontColor=#000000;"
BAND = "rounded=0;whiteSpace=wrap;html=1;fillColor=none;strokeColor=#000000;dashed=1;align=left;verticalAlign=top;spacingLeft=8;spacingTop=4;fontFamily=Arial;fontSize=11;fontColor=#000000;"

# edges
ASSOC = "endArrow=none;html=1;fontFamily=Arial;fontSize=10;fontColor=#000000;"
INCLUDE = "endArrow=open;endFill=0;dashed=1;html=1;fontFamily=Arial;fontSize=10;fontColor=#000000;"
EXTEND = "endArrow=open;endFill=0;dashed=1;html=1;fontFamily=Arial;fontSize=10;fontColor=#000000;"
DEP = "endArrow=open;endFill=0;dashed=1;html=1;fontFamily=Arial;fontSize=10;fontColor=#000000;"
GEN = "endArrow=block;endFill=0;html=1;fontFamily=Arial;fontSize=10;fontColor=#000000;"
COMP = "startArrow=diamondThin;startFill=1;startSize=14;endArrow=none;html=1;fontFamily=Arial;fontSize=10;fontColor=#000000;"
FLOW = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;fontFamily=Arial;fontSize=10;fontColor=#000000;"
FLOW_OPEN = "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=open;endFill=0;fontFamily=Arial;fontSize=10;fontColor=#000000;"


def esc(value: str) -> str:
    return escape(value, {'"': "&quot;"})


def label(value: str, raw: bool = False) -> str:
    if raw:
        return value
    return esc(value).replace("\n", "<br>")


class Diagram:
    def __init__(self, name: str, width: int, height: int, page_name: str | None = None):
        self.name = name
        self.width = width
        self.height = height
        self.page_name = page_name or name
        self.cells: list[str] = []
        self._n = 0

    def _id(self, prefix: str = "c") -> str:
        self._n += 1
        return f"{prefix}{self._n}"

    def v(self, ident: str, value: str, x: float, y: float, w: float, h: float,
          style: str, raw: bool = False, parent: str = "1") -> str:
        self.cells.append(
            f'<mxCell id={quoteattr(ident)} value={quoteattr(label(value, raw))} '
            f'style={quoteattr(style)} vertex="1" parent={quoteattr(parent)}>'
            f'<mxGeometry x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" as="geometry"/>'
            f'</mxCell>'
        )
        return ident

    def e(self, ident: str, source: str, target: str, value: str = "", style: str = ASSOC,
          points: list[tuple[float, float]] | None = None, raw: bool = False) -> str:
        pts = ""
        if points:
            pts = '<Array as="points">' + "".join(
                f'<mxPoint x="{px:.1f}" y="{py:.1f}"/>' for px, py in points
            ) + "</Array>"
        self.cells.append(
            f'<mxCell id={quoteattr(ident)} value={quoteattr(label(value, raw))} '
            f'style={quoteattr(style)} edge="1" parent="1" source={quoteattr(source)} target={quoteattr(target)}>'
            f'<mxGeometry relative="1" as="geometry">{pts}</mxGeometry></mxCell>'
        )
        return ident

    def ep(self, ident: str, p1: tuple[float, float], p2: tuple[float, float],
           value: str = "", style: str = ASSOC,
           points: list[tuple[float, float]] | None = None, raw: bool = False) -> str:
        pts = ""
        if points:
            pts = '<Array as="points">' + "".join(
                f'<mxPoint x="{px:.1f}" y="{py:.1f}"/>' for px, py in points
            ) + "</Array>"
        self.cells.append(
            f'<mxCell id={quoteattr(ident)} value={quoteattr(label(value, raw))} '
            f'style={quoteattr(style)} edge="1" parent="1">'
            f'<mxGeometry relative="1" as="geometry">'
            f'<mxPoint x="{p1[0]:.1f}" y="{p1[1]:.1f}" as="sourcePoint"/>'
            f'<mxPoint x="{p2[0]:.1f}" y="{p2[1]:.1f}" as="targetPoint"/>{pts}'
            f'</mxGeometry></mxCell>'
        )
        return ident

    def save(self, path: Path) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        xml = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<mxfile host="app.diagrams.net" modified="2026-11-02T12:00:00.000Z" '
            'agent="opencode" version="24.0.0">\n'
            f'  <diagram id={quoteattr(self.name)} name={quoteattr(self.page_name)}>\n'
            f'    <mxGraphModel dx="1600" dy="1000" grid="0" gridSize="10" guides="1" '
            'tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" '
            f'pageWidth="{self.width}" pageHeight="{self.height}" math="0" shadow="0" '
            'background="#FFFFFF">\n'
            '      <root>\n'
            '        <mxCell id="0"/>\n'
            '        <mxCell id="1" parent="0"/>\n'
            + "\n".join("        " + c for c in self.cells) + "\n"
            '      </root>\n'
            '    </mxGraphModel>\n'
            '  </diagram>\n'
            '</mxfile>\n'
        )
        path.write_text(xml, encoding="utf-8")
        return path


def class_box(d: Diagram, ident: str, title: str, attrs: list[str], methods: list[str],
              x: float, y: float, width: float | None = None, abstract: bool = False) -> tuple[float, float, float, float]:
    """UML class as a swimlane with one row per attribute/method."""
    title_text = title
    longest = max([len(title) * 8.0] + [len(a) * 6.2 for a in attrs] + [len(m) * 6.2 for m in methods] + [150])
    w = width or (longest + 28)
    title_h = 30
    attr_h = 18
    meth_h = 18
    h = title_h + len(attrs) * attr_h + (1 if methods else 0) + len(methods) * meth_h + 8
    style = (
        "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;"
        "horizontal=1;startSize=30;horizontalStack=0;resizeParent=0;resizeParentMax=0;"
        "collapsible=0;marginBottom=0;html=1;fontFamily=Arial;fontSize=11;fontColor=#000000;"
        "fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;"
    )
    display = f"<i>{esc(title)}</i>" if abstract else title
    d.v(ident, display, x, y, w, h, style, raw=abstract)
    yy = title_h
    for i, attr in enumerate(attrs):
        d.v(f"{ident}_a{i}", attr, 0, yy, w, attr_h,
            "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;"
            "spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontFamily=Arial;"
            "fontSize=10;fontColor=#000000;html=1;", parent=ident)
        yy += attr_h
    if methods:
        d.v(f"{ident}_sep", "", 0, yy, w, 1,
            "rounded=0;fillColor=#000000;strokeColor=none;html=1;", parent=ident)
        yy += 1
        for i, meth in enumerate(methods):
            d.v(f"{ident}_m{i}", meth, 0, yy, w, meth_h,
                "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;"
                "spacingLeft=6;spacingRight=4;overflow=hidden;rotatable=0;fontFamily=Arial;"
                "fontSize=10;fontColor=#000000;html=1;", parent=ident)
            yy += meth_h
    return x, y, w, h


def enum_box(d: Diagram, ident: str, title: str, values: list[str],
             x: float, y: float, width: float = 220) -> tuple[float, float, float, float]:
    w = max(width, len(title) * 8.0 + 30, max((len(v) * 7.0 for v in values), default=0) + 30)
    h = 44 + len(values) * 17 + 8
    style = (
        "swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;"
        "horizontal=1;startSize=44;horizontalStack=0;resizeParent=0;resizeParentMax=0;"
        "collapsible=0;marginBottom=0;html=1;fontFamily=Arial;fontSize=11;fontColor=#000000;"
        "fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=1;"
    )
    d.v(ident, f"<i>«enumeration»</i><br><b>{esc(title)}</b>", x, y, w, h, style, raw=True)
    for i, value in enumerate(values):
        d.v(f"{ident}_v{i}", value, 0, 44 + i * 17, w, 17,
            "text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;"
            "spacingLeft=8;spacingRight=4;overflow=hidden;rotatable=0;fontFamily=Arial;"
            "fontSize=10;fontColor=#000000;html=1;", parent=ident)
    return x, y, w, h


def object_box(d: Diagram, ident: str, title: str, attrs: list[str],
               x: float, y: float, width: float = 300) -> tuple[float, float, float, float]:
    w = max(width, max((len(a) * 6.1 for a in attrs), default=0) + 30, len(title) * 8.0 + 30)
    h = 30 + len(attrs) * 16 + 12
    rows = "<br>".join(esc(a) for a in attrs)
    value = (
        f"<div style='text-align:center;padding:2px 0 3px 0;'><u>{esc(title)}</u></div>"
        "<hr style='border:0;border-top:1px solid #000;margin:0 0 4px 0;'>"
        f"<div style='text-align:left;line-height:1.25;'>{rows}</div>"
    )
    style = (
        "rounded=0;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;"
        "strokeWidth=1;align=left;verticalAlign=top;spacingLeft=8;spacingRight=6;"
        "spacingTop=4;fontFamily=Arial;fontSize=10;fontColor=#000000;"
    )
    d.v(ident, value, x, y, w, h, style, raw=True)
    return x, y, w, h


def text(d: Diagram, ident: str, value: str, x: float, y: float, w: float, h: float,
         style: str = SMALL, raw: bool = False) -> None:
    d.v(ident, value, x, y, w, h, style, raw=raw)
