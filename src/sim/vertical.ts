import type { Platform } from './scenarios';
import type { EntityState } from './types';

export interface VerticalParams {
  gravity: number;
  jumpSpeed: number;
  maxFallSpeed: number;
  coyoteTicks: number;
  jumpBufferTicks: number;
  maxJumps: number;
  topY: number;
}

export function stepVertical(
  entity: EntityState,
  params: VerticalParams,
  dtSeconds: number,
  jumpPressedEdge: boolean,
  platforms: readonly Platform[],
  locked: boolean = false,
  gravityScale: number = 1.0,
): void {
  const wasGrounded = entity.grounded;

  if (entity.landingTicks > 0) {
    entity.landingTicks -= 1;
  }

  if (jumpPressedEdge) {
    entity.jumpBufferTicks = params.jumpBufferTicks;
  }

  if (wasGrounded) {
    entity.coyoteTicks = params.coyoteTicks;
  } else if (entity.coyoteTicks > 0) {
    entity.coyoteTicks -= 1;
  }

  const canGroundJump =
    entity.jumpBufferTicks > 0 && (wasGrounded || entity.coyoteTicks > 0);
  // The air jump needs a fresh press (never the held key) and is rejected
  // inside the coyote window, so a coyote jump stays a ground jump and keeps
  // the air jump available.
  const canAirJump =
    jumpPressedEdge &&
    !wasGrounded &&
    entity.coyoteTicks <= 0 &&
    entity.jumpsUsed < params.maxJumps;

  if (!locked) {
    if (canGroundJump) {
      entity.vy = -params.jumpSpeed;
      entity.grounded = false;
      entity.coyoteTicks = 0;
      entity.jumpBufferTicks = 0;
      entity.jumpsUsed = 1;
      entity.landingTicks = 0;
    } else if (canAirJump) {
      entity.vy = -params.jumpSpeed;
      entity.jumpBufferTicks = 0;
      entity.jumpsUsed += 1;
      entity.landingTicks = 0;
    }
  }

  const effectiveGravity = params.gravity * gravityScale;
  entity.vy = Math.min(entity.vy + effectiveGravity * dtSeconds, params.maxFallSpeed);

  const previousY = entity.y;
  entity.y += entity.vy * dtSeconds;

  if (entity.y < params.topY) {
    entity.y = params.topY;
    if (entity.vy < 0) {
      entity.vy = 0;
    }
  }

  let landed = false;
  if (entity.vy >= 0) {
    for (const platform of platforms) {
      if (
        entity.x >= platform.x1 &&
        entity.x <= platform.x2 &&
        previousY <= platform.yTop &&
        entity.y >= platform.yTop
      ) {
        const impactVy = entity.vy;
        entity.y = platform.yTop;
        entity.vy = 0;
        entity.grounded = true;
        landed = true;
        if (!wasGrounded && impactVy >= 180) {
          entity.landingTicks = 3;
        }
        break;
      }
    }
  }
  if (!landed) {
    entity.grounded = false;
  }

  // Touching ground (or a platform) replenishes the whole jump cycle.
  if (entity.grounded) {
    entity.jumpsUsed = 0;
  }

  if (entity.jumpBufferTicks > 0) {
    entity.jumpBufferTicks -= 1;
  }
}
