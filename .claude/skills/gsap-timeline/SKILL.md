---
name: gsap-timeline
description: Official GSAP skill for timelines — gsap.timeline(), position parameter, nesting, playback. Use when sequencing animations, choreographing keyframes, or when the user asks about animation sequencing, timelines, or animation order.
license: MIT
source: https://github.com/greensock/gsap-skills
---

# GSAP Timeline

## When to Use This Skill

Apply when building multi-step animations, coordinating several tweens in sequence or parallel, or when the user asks about timelines, sequencing, or keyframe-style animation in GSAP.

**Related skills:** For single tweens use **gsap-core**; for scroll-driven timelines use **gsap-scrolltrigger**; for React use **gsap-react**.

## Creating a Timeline

```javascript
const tl = gsap.timeline();
tl.to(".a", { x: 100, duration: 1 })
  .to(".b", { y: 50, duration: 0.5 })
  .to(".c", { opacity: 0, duration: 0.3 });
```

By default tweens append sequentially. Use the **position parameter** to place tweens at specific times.

## Position Parameter

| Value | Meaning |
|-------|---------|
| `0` or `1` | Absolute time in seconds |
| `"+=0.5"` | 0.5s after end of previous |
| `"-=0.2"` | 0.2s before end of previous |
| `"<"` | Same start as previous tween |
| `"<0.2"` | 0.2s after previous start |
| `">"` | After previous ends (default) |
| `"labelName"` | At that label |
| `"labelName+=0.3"` | 0.3s after label |

```javascript
tl.to(".a", { x: 100 }, 0);           // at 0
tl.to(".b", { y: 50 }, "+=0.5");      // 0.5s after last end
tl.to(".c", { opacity: 0 }, "<");     // same start as previous
tl.to(".d", { scale: 2 }, "<0.2");    // 0.2s after previous start
```

## Timeline Defaults

```javascript
const tl = gsap.timeline({ defaults: { duration: 0.5, ease: "power2.out" } });
tl.to(".a", { x: 100 }).to(".b", { y: 50 }); // both inherit 0.5s + power2.out
```

## Timeline Options (constructor)

- **paused: true** — create paused; call `.play()` to start
- **repeat**, **yoyo** — same as tweens; apply to whole timeline
- **defaults** — vars merged into every child tween
- **onComplete**, **onStart**, **onUpdate** — timeline-level callbacks
- **scrollTrigger** — attach ScrollTrigger to the entire timeline

## Labels

```javascript
tl.addLabel("intro", 0);
tl.to(".a", { x: 100 }, "intro");

tl.addLabel("outro", "+=0.5");
tl.to(".b", { opacity: 0 }, "outro");

tl.play("outro");                    // start from "outro"
tl.tweenFromTo("intro", "outro");   // animate between labels
```

## Nesting Timelines

```javascript
const master = gsap.timeline();
const child = gsap.timeline();
child.to(".a", { x: 100 }).to(".b", { y: 50 });
master.add(child, 0);
master.to(".c", { opacity: 0 }, "+=0.2");
```

## Controlling Playback

```javascript
tl.play()             // play from current position
tl.pause()            // pause
tl.reverse()          // play backwards
tl.restart()          // go to start and play
tl.time(2)            // seek to 2 seconds
tl.progress(0.5)      // seek to 50%
tl.kill()             // kill timeline and children
```

## Best Practices

- ✅ Use the **position parameter** for choreography — not `delay` on individual tweens
- ✅ Pass `defaults` when child tweens share the same duration/ease
- ✅ Put ScrollTrigger on the **timeline**, not on tweens inside a timeline
- ✅ Add `addLabel()` for readable, maintainable sequencing
- ✅ Create paused timelines (`paused: true`) when triggering on user interaction

## Do Not

- ❌ Chain animations with `delay` when a timeline can sequence them
- ❌ Nest animations with ScrollTrigger inside a parent timeline
- ❌ Confuse timeline `duration` (determined by children) with tween `duration`

https://gsap.com/docs/v3/GSAP/Timeline/
