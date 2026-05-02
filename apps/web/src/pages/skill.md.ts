import type { APIRoute } from "astro";
import skillMarkdown from "../../../cli/SKILL.md?raw";

export const prerender = true;

/** Serves `apps/cli/SKILL.md` at https://autodraw.ink/skill.md */
export const GET: APIRoute = () =>
	new Response(skillMarkdown, {
		status: 200,
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			"Cache-Control": "public, max-age=86400",
		},
	});
