import { useEffect, useRef } from "react";
import { getMascotById } from "../shared/mascots";
import type { Team } from "../shared/types";

// Quad-tree data structure for efficient collision detection
class QuadTree {
  private bounds: { x: number; y: number; width: number; height: number };
  private capacity: number;
  private points: Array<{ x: number; y: number; index: number; width: number; height: number }>;
  private divided: boolean;
  private northeast?: QuadTree;
  private northwest?: QuadTree;
  private southeast?: QuadTree;
  private southwest?: QuadTree;

  constructor(bounds: { x: number; y: number; width: number; height: number }, capacity: number = 4) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  insert(point: { x: number; y: number; index: number; width: number; height: number }): boolean {
    if (!this.contains(point)) {
      return false;
    }

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northeast!.insert(point) ||
      this.northwest!.insert(point) ||
      this.southeast!.insert(point) ||
      this.southwest!.insert(point)
    );
  }

  query(range: { x: number; y: number; width: number; height: number }): Array<{ x: number; y: number; index: number; width: number; height: number }> {
    const found: Array<{ x: number; y: number; index: number; width: number; height: number }> = [];

    if (!this.intersects(range)) {
      return found;
    }

    for (const point of this.points) {
      if (this.pointInRange(point, range)) {
        found.push(point);
      }
    }

    if (this.divided) {
      found.push(...this.northeast!.query(range));
      found.push(...this.northwest!.query(range));
      found.push(...this.southeast!.query(range));
      found.push(...this.southwest!.query(range));
    }

    return found;
  }

  private contains(point: { x: number; y: number; width: number; height: number }): boolean {
    return (
      point.x >= this.bounds.x &&
      point.x + point.width <= this.bounds.x + this.bounds.width &&
      point.y >= this.bounds.y &&
      point.y + point.height <= this.bounds.y + this.bounds.height
    );
  }

  private intersects(range: { x: number; y: number; width: number; height: number }): boolean {
    return !(
      range.x > this.bounds.x + this.bounds.width ||
      range.x + range.width < this.bounds.x ||
      range.y > this.bounds.y + this.bounds.height ||
      range.y + range.height < this.bounds.y
    );
  }

  private pointInRange(point: { x: number; y: number; width: number; height: number }, range: { x: number; y: number; width: number; height: number }): boolean {
    return !(
      point.x > range.x + range.width ||
      point.x + point.width < range.x ||
      point.y > range.y + range.height ||
      point.y + point.height < range.y
    );
  }

  private subdivide(): void {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;

    this.northeast = new QuadTree({ x: x + w, y, width: w, height: h }, this.capacity);
    this.northwest = new QuadTree({ x, y, width: w, height: h }, this.capacity);
    this.southeast = new QuadTree({ x: x + w, y: y + h, width: w, height: h }, this.capacity);
    this.southwest = new QuadTree({ x, y: y + h, width: w, height: h }, this.capacity);

    this.divided = true;
  }
}

// Configuration constants for drink tank behavior
const DRINK_TANK_CONFIG = {
  // Animation timing
  transitionDuration: '40s',
  initialTransitionDuration: '8s',
  minInterval: 6000,
  maxInterval: 9000,

  // Movement ranges (± pixels from current position)
  horizontalMovement: 800,
  verticalMovement: 600,

  // Container dimensions
  containerHeight: 500,

  // Bubble sizing (clamp values)
  bubbleMinSize: 64,
  bubbleMaxSize: 112,
  mascotMinSize: 48,
  mascotMaxSize: 84,

  // Collision and spacing
  edgePadding: 25,
  collisionPadding: 30,
  nameSpacing: 60,

  // Positioning spread
  initialSpreadX: 400,
  initialSpreadY: 300,
  initialOffset: 50,
} as const;

// Modern floating team card styles
const mascotCardStyles = `
  .team-float-card {
    position: absolute;
    border-radius: 1rem;
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.85));
    border: 1.5px solid rgba(6, 182, 212, 0.4);
    box-shadow: 
      0 8px 32px rgba(6, 182, 212, 0.15),
      0 0 20px rgba(6, 182, 212, 0.1),
      inset 0 1px 1px rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    will-change: transform;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${DRINK_TANK_CONFIG.transitionDuration} cubic-bezier(0.25, 0.46, 0.45, 0.94);
    overflow: hidden;
  }

  .team-float-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(circle at 30% 30%, rgba(244, 114, 182, 0.08) 0%, rgba(6, 182, 212, 0.12) 50%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .team-float-card:hover {
    transform: scale(1.08) translateY(-8px);
    border-color: rgba(6, 182, 212, 0.7);
    box-shadow: 
      0 12px 40px rgba(6, 182, 212, 0.25),
      0 0 30px rgba(6, 182, 212, 0.2),
      inset 0 1px 1px rgba(255, 255, 255, 0.15);
  }

  .team-float-name {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(51, 65, 85, 0.9));
    border: 1px solid rgba(6, 182, 212, 0.3);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 
      0 4px 12px rgba(0, 0, 0, 0.3),
      0 0 8px rgba(6, 182, 212, 0.15);
  }
`;

interface DrinkTankProps {
  teams: Team[];
  className?: string;
}

export function DrinkTank({ teams, className = "" }: DrinkTankProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current || teams.length === 0) return;

    // Initialize bubbleRefs array with correct length
    bubbleRefs.current = new Array(teams.length).fill(null);

    const container = containerRef.current;
    const bubbles = bubbleRefs.current;

    // Individual timers for each mascot to create asynchronous movement
    const mascotTimers: NodeJS.Timeout[] = [];

    // Function to move a single mascot with optimized collision detection
    const moveSingleMascot = (mascotIndex: number) => {
      const bubble = bubbles[mascotIndex];
      if (!bubble) return;

      const rect = bubble.getBoundingClientRect();
      const pos = {
        index: mascotIndex,
        x: parseFloat(bubble.style.left) || 0,
        y: parseFloat(bubble.style.top) || 0,
        width: rect.width,
        height: rect.height + DRINK_TANK_CONFIG.nameSpacing,
      };

      const containerRect = container.getBoundingClientRect();
      const maxX = containerRect.width - pos.width - DRINK_TANK_CONFIG.collisionPadding;
      const maxY = containerRect.height - pos.height - DRINK_TANK_CONFIG.collisionPadding;

      let newX = Math.max(15, Math.min(maxX, pos.x + (Math.random() - 0.5) * DRINK_TANK_CONFIG.horizontalMovement));
      let newY = Math.max(15, Math.min(maxY, pos.y + (Math.random() - 0.5) * DRINK_TANK_CONFIG.verticalMovement));

      // Edge collision detection and avoidance
      const edgePadding = DRINK_TANK_CONFIG.edgePadding;
      const leftEdge = edgePadding;
      const rightEdge = containerRect.width - pos.width - edgePadding;
      const topEdge = edgePadding;
      const bottomEdge = containerRect.height - pos.height - edgePadding;

      // Push away from edges
      if (newX < leftEdge) {
        newX = leftEdge + Math.random() * 40;
      } else if (newX > rightEdge) {
        newX = rightEdge - Math.random() * 40;
      }

      if (newY < topEdge) {
        newY = topEdge + Math.random() * 40;
      } else if (newY > bottomEdge) {
        newY = bottomEdge - Math.random() * 40;
      }

      // Create quad-tree with current positions for efficient collision detection
      const quadTree = new QuadTree({
        x: 0,
        y: 0,
        width: containerRect.width,
        height: containerRect.height
      });

      // Insert all mascot positions into quad-tree
      bubbles.forEach((b, i) => {
        if (!b || i === mascotIndex) return; // Don't insert self for collision check
        const bRect = b.getBoundingClientRect();
        quadTree.insert({
          x: parseFloat(b.style.left) || 0,
          y: parseFloat(b.style.top) || 0,
          index: i,
          width: bRect.width,
          height: bRect.height + DRINK_TANK_CONFIG.nameSpacing,
        });
      });

      // Query quad-tree for nearby mascots (potential collision candidates)
      const queryBounds = {
        x: newX - pos.width,
        y: newY - pos.height,
        width: pos.width * 3, // Search area slightly larger than mascot
        height: pos.height * 3,
      };

      const nearbyMascots = quadTree.query(queryBounds);

      // Check collisions only against nearby mascots (much more efficient!)
      nearbyMascots.forEach((otherPos) => {
        const dx = newX - otherPos.x;
        const dy = newY - otherPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (pos.width + otherPos.width) / 2;

        if (distance < minDistance) {
          // Move away from collision
          const angle = Math.atan2(dy, dx);
          const pushDistance = minDistance - distance + 10;

          newX += Math.cos(angle) * pushDistance * 0.5;
          newY += Math.sin(angle) * pushDistance * 0.5;

          // Keep within bounds after collision avoidance
          newX = Math.max(10, Math.min(maxX, newX));
          newY = Math.max(10, Math.min(maxY, newY));
        }
      });

      // Apply new position
      bubble.style.left = `${newX}px`;
      bubble.style.top = `${newY}px`;
    };

    // Create individual timers for each mascot with different intervals
    teams.forEach((_team, index) => {
      const timer = setTimeout(() => {
        // Initial movement
        moveSingleMascot(index);

        // Set up recurring movement for this mascot
        const recurringTimer = setInterval(() => {
          moveSingleMascot(index);
        }, DRINK_TANK_CONFIG.minInterval + Math.random() * (DRINK_TANK_CONFIG.maxInterval - DRINK_TANK_CONFIG.minInterval));

        mascotTimers.push(recurringTimer);
      }, Math.random() * 2000); // Stagger initial movements

      mascotTimers.push(timer);
    });

    return () => {
      mascotTimers.forEach(timer => clearTimeout(timer));
      mascotTimers.forEach(timer => clearInterval(timer));
    };
  }, [teams.length]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: mascotCardStyles }} />
      <div
        ref={containerRef}
        className={`relative w-full overflow-visible pointer-events-none ${className}`}
        style={{ height: `${DRINK_TANK_CONFIG.containerHeight}px` }}
      >
        {teams.map((team, index) => {
          const mascot = getMascotById(team.mascotId);

          // Create initial positioning
          const left = (index * 150) % DRINK_TANK_CONFIG.initialSpreadX + DRINK_TANK_CONFIG.initialOffset; // Spread out initially
          const top = (index * 100) % DRINK_TANK_CONFIG.initialSpreadY + DRINK_TANK_CONFIG.initialOffset; // Spread out initially

          return (
            <div
              key={team.id}
              ref={(el) => { if (el) bubbleRefs.current[index] = el; }}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                transition: `all ${DRINK_TANK_CONFIG.initialTransitionDuration} cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
                position: 'absolute',
              }}
            >
              {/* Modern team card with mascot and name */}
              <div className="flex flex-col items-center justify-center">
                {/* Card container with mascot */}
                <div className="relative flex items-center justify-center">
                  <div
                    className="team-float-card"
                    style={{
                      width: `clamp(${DRINK_TANK_CONFIG.bubbleMinSize}px, 8vw, ${DRINK_TANK_CONFIG.bubbleMaxSize}px)`,
                      height: `clamp(${DRINK_TANK_CONFIG.bubbleMinSize}px, 8vw, ${DRINK_TANK_CONFIG.bubbleMaxSize}px)`,
                    }}
                  >
                    {/* Mascot positioned inside card */}
                    <div className="relative z-10 flex items-center justify-center w-full h-full">
                      {mascot ? (
                        <img
                          src={mascot.path}
                          alt={mascot.name}
                          className="object-contain"
                          style={{
                            width: `clamp(${DRINK_TANK_CONFIG.mascotMinSize}px, 6vw, ${DRINK_TANK_CONFIG.mascotMaxSize}px)`,
                            height: `clamp(${DRINK_TANK_CONFIG.mascotMinSize}px, 6vw, ${DRINK_TANK_CONFIG.mascotMaxSize}px)`,
                            filter: 'drop-shadow(0 2px 4px rgba(6, 182, 212, 0.3))',
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.textContent = team.teamName.charAt(0).toUpperCase();
                              parent.className = "text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-cyan-400 flex items-center justify-center w-full h-full";
                            }
                          }}
                        />
                      ) : (
                        <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-cyan-400 drop-shadow-[0_2px_4px_rgba(6,182,212,0.4)]">
                          {team.teamName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team name badge below card */}
                <div
                  className="flex justify-center"
                  style={{ marginTop: 'clamp(24px, 3vw, 36px)' }}
                >
                  <span className="team-float-name text-xs sm:text-sm font-semibold text-cyan-100 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 whitespace-nowrap">
                    {team.teamName}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
