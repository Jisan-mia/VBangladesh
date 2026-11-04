#!/bin/sh
# Runs the statechart skill (TLA+ → checked rules + Mermaid chart) with this machine's TLC and Java.
# Usage: scripts/statechart.sh ai_docs/statecharts/<slug>/<Spec>.tla --view ai_docs/statecharts/<slug>/view.ts --out ai_docs/statecharts/<slug>/chart
SKILL="${STATECHART_SKILL:-$HOME/Library/Application Support/orca/claude-profiles/1e2db981-883c-45fb-a287-30e1689c4f1b/home/skills/statechart}"
JAR="${TLA2TOOLS:-$HOME/.cache/tla/tla2tools.jar}"
if [ ! -f "$JAR" ]; then
  mkdir -p "$(dirname "$JAR")" && curl -sL -o "$JAR" https://github.com/tlaplus/tlaplus/releases/download/v1.7.4/tla2tools.jar || exit 2
fi
TLA2TOOLS="$JAR" JAVA="${JAVA:-$(command -v java || echo /opt/homebrew/opt/openjdk@17/bin/java)}" exec "$SKILL/scripts/statechart" "$@"
