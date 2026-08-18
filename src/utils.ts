// deno-lint-ignore-file no-explicit-any

export function throttle<F extends (...args: any[]) => void>(
	fn: F, interval: number = 0
): (...args: Parameters<F>) => void {
	let callTime = 0, lastTime = -Infinity, accumTime = 0;
	return (...args: Parameters<F>) => {
		callTime = performance.now();
		accumTime += callTime - lastTime;
		lastTime = callTime;
		if (accumTime < interval) return;
		accumTime = 0;
		setTimeout(fn, interval, ...args);
	}
}

export function debounce<F extends (...args: any[]) => void>(
	fn: F, interval: number = 0
): (...args: Parameters<F>) => void {
	let timeout: undefined | ReturnType<typeof setTimeout>;
	return (...args: Parameters<F>): void => {
		clearTimeout(timeout);
		timeout = setTimeout(
			fn, interval, ...args
		)
	}
}
