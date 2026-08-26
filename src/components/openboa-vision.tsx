"use client"

import {
  storyItemStyle,
  type StoryMotion,
  storySceneStyle,
  useOpenBoaStory,
} from "./use-openboa-story"

interface VisionLine {
  copy?: string
  accent?: string
}

interface VisionStatement {
  behavior: StoryMotion
  composition: "origin" | "relay" | "synthesis" | "horizon"
  lines: readonly VisionLine[]
}

const statements: readonly VisionStatement[] = [
  {
    behavior: "alignment",
    composition: "origin",
    lines: [
      { copy: "Humanity is defined not only" },
      { copy: "by what it can understand," },
      { copy: "but by what it can" },
      { accent: "imagine and realize." },
    ],
  },
  {
    behavior: "relay",
    composition: "relay",
    lines: [
      { copy: "Agents are expanding" },
      { copy: "the scope of" },
      { accent: "human creation." },
    ],
  },
  {
    behavior: "synthesis",
    composition: "synthesis",
    lines: [
      { copy: "OpenBoa explores" },
      { copy: "this new horizon through the" },
      { accent: "Business of Agents." },
    ],
  },
  {
    behavior: "horizon",
    composition: "horizon",
    lines: [
      { copy: "To expand the horizon" },
      { copy: "of human ", accent: "possibility." },
    ],
  },
]

export function OpenBoaVision() {
  const { rootRef, progress } = useOpenBoaStory(statements.length)

  return (
    <main
      className="story-page vision-page"
      ref={rootRef}
      style={{ "--story-scenes": statements.length } as React.CSSProperties}
      aria-label="OpenBoa vision"
    >
      <div className="story-stage vision-stage">
        {statements.map((statement, index) => {
          const Heading = index === 0 ? "h1" : "h2"
          return (
            <section
              className={`story-scene vision-scene vision-scene--${statement.composition}`}
              data-behavior={statement.behavior}
              key={statement.behavior}
              style={storySceneStyle(progress, index, statements.length)}
              aria-hidden={Math.abs(progress - index) > 0.42}
            >
              <div className="vision-statement" data-aperture-target>
                <Heading>
                  {statement.lines.map((line, lineIndex) => (
                    <span
                      className="story-copy-item story-line"
                      data-aperture-copy
                      key={`${line.copy ?? ""}${line.accent ?? ""}`}
                      style={storyItemStyle(
                        progress,
                        index,
                        statements.length,
                        lineIndex,
                        statement.lines.length,
                        statement.behavior,
                      )}
                    >
                      {line.copy}
                      {line.accent ? <em>{line.accent}</em> : null}
                    </span>
                  ))}
                </Heading>
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
