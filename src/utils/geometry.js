/**
 * Utility functions for geometry calculations
 */

/**
 * Point class
 */
export class Point {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Point(this.x, this.y);
    }

    add(other) {
        return new Point(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Point(this.x - other.x, this.y - other.y);
    }

    multiply(scalar) {
        return new Point(this.x * scalar, this.y * scalar);
    }

    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    equals(other) {
        return this.x === other.x && this.y === other.y;
    }

    toString() {
        return `(${this.x}, ${this.y})`;
    }
}

/**
 * Rectangle class
 */
export class Rectangle {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get left() { return this.x; }
    get right() { return this.x + this.width; }
    get top() { return this.y; }
    get bottom() { return this.y + this.height; }
    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }
    get center() { return new Point(this.centerX, this.centerY); }

    clone() {
        return new Rectangle(this.x, this.y, this.width, this.height);
    }

    contains(point) {
        return point.x >= this.left && point.x <= this.right &&
            point.y >= this.top && point.y <= this.bottom;
    }

    intersects(other) {
        return !(other.left > this.right ||
            other.right < this.left ||
            other.top > this.bottom ||
            other.bottom < this.top);
    }

    union(other) {
        const x = Math.min(this.x, other.x);
        const y = Math.min(this.y, other.y);
        const right = Math.max(this.right, other.right);
        const bottom = Math.max(this.bottom, other.bottom);
        return new Rectangle(x, y, right - x, bottom - y);
    }

    expand(amount) {
        return new Rectangle(
            this.x - amount,
            this.y - amount,
            this.width + amount * 2,
            this.height + amount * 2
        );
    }

    getConnectionPoint(side) {
        switch (side) {
            case 'top': return new Point(this.centerX, this.top);
            case 'right': return new Point(this.right, this.centerY);
            case 'bottom': return new Point(this.centerX, this.bottom);
            case 'left': return new Point(this.left, this.centerY);
            case 'center': return this.center;
            default: return this.center;
        }
    }

    getNearestConnectionPoint(point) {
        const points = {
            top: this.getConnectionPoint('top'),
            right: this.getConnectionPoint('right'),
            bottom: this.getConnectionPoint('bottom'),
            left: this.getConnectionPoint('left')
        };

        let nearest = 'top';
        let minDist = Infinity;

        for (const [side, p] of Object.entries(points)) {
            const dist = point.distanceTo(p);
            if (dist < minDist) {
                minDist = dist;
                nearest = side;
            }
        }

        return { side: nearest, point: points[nearest] };
    }
}

/**
 * Calculate the intersection point of a line with a rectangle
 * @param {Point} lineStart - Start of line
 * @param {Point} lineEnd - End of line (or direction)
 * @param {Rectangle} rect - Rectangle to intersect
 * @returns {Point|null} Intersection point or null
 */
export function lineRectIntersection(lineStart, lineEnd, rect) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    let tmin = -Infinity;
    let tmax = Infinity;

    if (dx !== 0) {
        const t1 = (rect.left - lineStart.x) / dx;
        const t2 = (rect.right - lineStart.x) / dx;
        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));
    }

    if (dy !== 0) {
        const t1 = (rect.top - lineStart.y) / dy;
        const t2 = (rect.bottom - lineStart.y) / dy;
        tmin = Math.max(tmin, Math.min(t1, t2));
        tmax = Math.min(tmax, Math.max(t1, t2));
    }

    if (tmax < tmin || tmax < 0) return null;

    const t = tmin >= 0 ? tmin : tmax;
    return new Point(lineStart.x + t * dx, lineStart.y + t * dy);
}

/**
 * Snap a value to a grid
 * @param {number} value - Value to snap
 * @param {number} gridSize - Grid size
 * @returns {number} Snapped value
 */
export function snapToGrid(value, gridSize = 20) {
    return Math.round(value / gridSize) * gridSize;
}

/**
 * Snap a point to a grid
 * @param {Point} point - Point to snap
 * @param {number} gridSize - Grid size
 * @returns {Point} Snapped point
 */
export function snapPointToGrid(point, gridSize = 20) {
    return new Point(
        snapToGrid(point.x, gridSize),
        snapToGrid(point.y, gridSize)
    );
}

/**
 * Generate a unique ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Calculate angle between two points (in radians)
 * @param {Point} from - Start point
 * @param {Point} to - End point
 * @returns {number} Angle in radians
 */
export function angleBetween(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
