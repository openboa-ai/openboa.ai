"use client"

import { principles, products } from "@/lib/openboa/site-content"
import {
  storyItemStyle,
  storySceneStyle,
  useOpenBoaStory,
} from "./use-openboa-story"

const sceneCount = 3

export function OpenBoaAbout() {
  const { rootRef, progress } = useOpenBoaStory(sceneCount)

  return (
    <main
      className="story-page about-page"
      ref={rootRef}
      style={{ "--story-scenes": sceneCount } as React.CSSProperties}
      aria-label="About OpenBoa"
    >
      <div className="story-stage about-stage">
        <section
          className="story-scene about-scene about-scene--introduction"
          data-behavior="formation"
          style={storySceneStyle(progress, 0, sceneCount)}
          aria-hidden={progress > 0.42}
        >
          <div className="about-introduction-copy" data-aperture-target>
            <p
              className="about-mark story-copy-item"
              data-aperture-copy
              style={storyItemStyle(progress, 0, sceneCount, 0, 5, "formation")}
            >
              About OpenBoa
            </p>
            <h1>
              <span
                className="story-copy-item story-line"
                data-aperture-copy
                style={storyItemStyle(progress, 0, sceneCount, 1, 5, "formation")}
              >
                OpenBoa develops
              </span>
              <span
                className="story-copy-item story-line"
                data-aperture-copy
                style={storyItemStyle(progress, 0, sceneCount, 2, 5, "formation")}
              >
                <em>AI-native businesses</em>
              </span>
              <span
                className="story-copy-item story-line"
                data-aperture-copy
                style={storyItemStyle(progress, 0, sceneCount, 3, 5, "formation")}
              >
                and products.
              </span>
            </h1>
            <p
              className="about-introduction-body story-copy-item"
              data-aperture-copy
              style={storyItemStyle(progress, 0, sceneCount, 4, 5, "formation")}
            >
              We begin with what agents make possible, then build the products,
              organizations, and business models that let that possibility
              become real.
            </p>
          </div>
        </section>

        <section
          className="story-scene about-scene about-scene--system"
          data-behavior="orbit"
          style={storySceneStyle(progress, 1, sceneCount)}
          aria-hidden={Math.abs(progress - 1) > 0.42}
        >
          <div className="about-system-copy" data-aperture-target>
            <p
              className="about-mark story-copy-item"
              data-aperture-copy
              style={storyItemStyle(progress, 1, sceneCount, 0, 7, "orbit")}
            >
              How we build
            </p>
            <h2>
              <span
                className="story-copy-item story-line"
                data-aperture-copy
                style={storyItemStyle(progress, 1, sceneCount, 1, 7, "orbit")}
              >
                Agent-native is
              </span>
              <span
                className="story-copy-item story-line"
                data-aperture-copy
                style={storyItemStyle(progress, 1, sceneCount, 2, 7, "orbit")}
              >
                the starting condition,
              </span>
              <span
                className="story-copy-item story-line"
                data-aperture-copy
                style={storyItemStyle(progress, 1, sceneCount, 3, 7, "orbit")}
              >
                not a feature layer.
              </span>
            </h2>
            <ul className="principle-stream">
              {principles.map((principle, principleIndex) => (
                <li
                  className="story-copy-item"
                  data-aperture-copy
                  key={principle}
                  style={storyItemStyle(
                    progress,
                    1,
                    sceneCount,
                    principleIndex + 4,
                    7,
                    "orbit",
                  )}
                >
                  {principle}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="story-scene about-scene about-scene--products"
          data-behavior="loom"
          style={storySceneStyle(progress, 2, sceneCount)}
          aria-hidden={Math.abs(progress - 2) > 0.42}
        >
          <div className="about-products-copy" data-aperture-target>
            <p
              className="about-mark story-copy-item"
              data-aperture-copy
              style={storyItemStyle(progress, 2, sceneCount, 0, 5, "loom")}
            >
              Products
            </p>
            <h2>
              <span
                className="story-copy-item story-line"
                data-aperture-copy
                style={storyItemStyle(progress, 2, sceneCount, 1, 5, "loom")}
              >
                Different businesses,
              </span>
              <span
                className="story-copy-item story-line"
                data-aperture-copy
                style={storyItemStyle(progress, 2, sceneCount, 2, 5, "loom")}
              >
                one native premise.
              </span>
            </h2>
            <div className="about-product-list" aria-label="What OpenBoa builds">
              {products.map((product, productIndex) => (
                <a
                  key={product.name}
                  href={product.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="about-product story-copy-item"
                  style={storyItemStyle(
                    progress,
                    2,
                    sceneCount,
                    productIndex + 3,
                    5,
                    "loom",
                  )}
                >
                  <span className="about-product-name" data-aperture-copy>
                    {product.name}
                  </span>
                  <span className="about-product-detail" data-aperture-copy>
                    {product.detail}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
