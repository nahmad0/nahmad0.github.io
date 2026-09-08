"""
Nabil Allimi
CMSCI 453
Algorithm Project 3

Terminal pathfinding playground for comparing Dijkstra's algorithm and A*.
The script builds a random weighted grid, runs both algorithms, and can
animate how each search explores the board.
"""

from __future__ import annotations

import argparse
import heapq
import os
import random
import time
from dataclasses import dataclass


WALL = "#"
START = "S"
GOAL = "G"
PATH = "*"
EMPTY = "."


@dataclass(frozen=True)
class Point:
    row: int
    col: int


def build_grid(rows: int, cols: int, wall_rate: float, seed: int) -> tuple[list[list[str]], Point, Point]:
    rng = random.Random(seed)
    grid = []
    for _ in range(rows):
        row = []
        for _ in range(cols):
            row.append(WALL if rng.random() < wall_rate else str(rng.randint(1, 9)))
        grid.append(row)

    start = Point(0, 0)
    goal = Point(rows - 1, cols - 1)
    grid[start.row][start.col] = START
    grid[goal.row][goal.col] = GOAL

    # Keep a narrow safety corridor so each run is interesting and solvable.
    for r in range(rows):
        grid[r][0] = str(rng.randint(1, 5))
    for c in range(cols):
        grid[rows - 1][c] = str(rng.randint(1, 5))
    grid[start.row][start.col] = START
    grid[goal.row][goal.col] = GOAL

    return grid, start, goal


def neighbors(point: Point, rows: int, cols: int) -> list[Point]:
    out = []
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr = point.row + dr
        nc = point.col + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            out.append(Point(nr, nc))
    return out


def cell_cost(grid: list[list[str]], point: Point) -> int:
    tile = grid[point.row][point.col]
    if tile in {START, GOAL}:
        return 1
    return int(tile)


def heuristic(a: Point, b: Point) -> int:
    return abs(a.row - b.row) + abs(a.col - b.col)


def reconstruct_path(came_from: dict[Point, Point], start: Point, goal: Point) -> list[Point]:
    if goal not in came_from and goal != start:
        return []
    path = [goal]
    current = goal
    while current != start:
        current = came_from[current]
        path.append(current)
    path.reverse()
    return path


def search(
    grid: list[list[str]],
    start: Point,
    goal: Point,
    use_heuristic: bool,
) -> tuple[list[Point], int, list[Point]]:
    rows = len(grid)
    cols = len(grid[0])
    frontier: list[tuple[int, int, Point]] = []
    heapq.heappush(frontier, (0, 0, start))
    came_from: dict[Point, Point] = {}
    best_cost = {start: 0}
    visited_order: list[Point] = []
    counter = 1

    while frontier:
        _, _, current = heapq.heappop(frontier)
        if current in visited_order:
            continue
        visited_order.append(current)

        if current == goal:
            break

        for nxt in neighbors(current, rows, cols):
            if grid[nxt.row][nxt.col] == WALL:
                continue

            new_cost = best_cost[current] + cell_cost(grid, nxt)
            if nxt not in best_cost or new_cost < best_cost[nxt]:
                best_cost[nxt] = new_cost
                priority = new_cost
                if use_heuristic:
                    priority += heuristic(nxt, goal)
                came_from[nxt] = current
                heapq.heappush(frontier, (priority, counter, nxt))
                counter += 1

    path = reconstruct_path(came_from, start, goal)
    total_cost = best_cost.get(goal, -1)
    return path, total_cost, visited_order


def paint_grid(
    grid: list[list[str]],
    visited: set[Point] | None = None,
    path: set[Point] | None = None,
) -> str:
    visited = visited or set()
    path = path or set()
    lines = []
    for r, row in enumerate(grid):
        rendered = []
        for c, value in enumerate(row):
            point = Point(r, c)
            if point in path and value not in {START, GOAL}:
                rendered.append(PATH)
            elif point in visited and value not in {START, GOAL}:
                rendered.append("+")
            elif value == WALL:
                rendered.append(WALL)
            elif value in {START, GOAL}:
                rendered.append(value)
            else:
                rendered.append(value)
        lines.append(" ".join(rendered))
    return "\n".join(lines)


def clear_screen() -> None:
    os.system("cls" if os.name == "nt" else "clear")


def animate_run(
    title: str,
    grid: list[list[str]],
    visited_order: list[Point],
    path: list[Point],
    total_cost: int,
    delay: float,
) -> None:
    visited: set[Point] = set()
    for step, point in enumerate(visited_order, start=1):
        visited.add(point)
        clear_screen()
        print(title)
        print(f"Visited nodes: {step} | Current: ({point.row}, {point.col})")
        print()
        print(paint_grid(grid, visited=visited))
        time.sleep(delay)

    clear_screen()
    print(title)
    print(f"Final path cost: {total_cost} | Path length: {len(path)}")
    print()
    print(paint_grid(grid, visited=set(visited_order), path=set(path)))


def summarize(name: str, path: list[Point], total_cost: int, visited_order: list[Point]) -> str:
    if total_cost < 0:
        return f"{name:<10} no path found after exploring {len(visited_order)} cells"
    return (
        f"{name:<10} cost={total_cost:<4} "
        f"path_len={len(path):<3} explored={len(visited_order):<3}"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare Dijkstra and A* on the same random weighted grid."
    )
    parser.add_argument("--rows", type=int, default=12, help="Number of rows in the grid.")
    parser.add_argument("--cols", type=int, default=24, help="Number of columns in the grid.")
    parser.add_argument(
        "--wall-rate",
        type=float,
        default=0.18,
        help="Fraction of cells turned into walls.",
    )
    parser.add_argument("--seed", type=int, default=453, help="Random seed.")
    parser.add_argument(
        "--animate",
        action="store_true",
        help="Animate both searches in the terminal.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.03,
        help="Delay between animation frames in seconds.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    grid, start, goal = build_grid(args.rows, args.cols, args.wall_rate, args.seed)

    dijkstra_path, dijkstra_cost, dijkstra_visited = search(
        grid,
        start,
        goal,
        use_heuristic=False,
    )
    a_star_path, a_star_cost, a_star_visited = search(
        grid,
        start,
        goal,
        use_heuristic=True,
    )

    print("Algorithm Project 3: Pathfinding Playground")
    print(f"Grid: {args.rows}x{args.cols} | Seed: {args.seed} | Wall rate: {args.wall_rate}")
    print()
    print(paint_grid(grid))
    print()
    print(summarize("Dijkstra", dijkstra_path, dijkstra_cost, dijkstra_visited))
    print(summarize("A*", a_star_path, a_star_cost, a_star_visited))

    if dijkstra_cost >= 0 and a_star_cost >= 0:
        print()
        print(
            "Observation: both algorithms reach the same optimal cost, "
            "but A* should usually explore fewer cells."
        )

    if args.animate:
        time.sleep(1.5)
        animate_run(
            "Dijkstra Search",
            grid,
            dijkstra_visited,
            dijkstra_path,
            dijkstra_cost,
            args.delay,
        )
        time.sleep(1.0)
        animate_run(
            "A* Search",
            grid,
            a_star_visited,
            a_star_path,
            a_star_cost,
            args.delay,
        )


if __name__ == "__main__":
    main()
