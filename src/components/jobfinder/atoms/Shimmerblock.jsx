/**
 * ShimmerBlock
 * Skeleton loading placeholder with a shimmer animation.
 *
 * @param {{ height?: number | string; width?: number | string; rounded?: string }} props
 */
export const ShimmerBlock = ({
    height = 14,
    width = "100%",
    rounded = "rounded-lg",
}) => {
    return (
        <div
            className={`shimmer-bg ${rounded}`}
            style={{
                height: typeof height === "number" ? `${height}px` : height,
                width: typeof width === "number" ? `${width}px` : width,
            }}
        />
    );
}

/**
 * ShimmerCard
 * A full skeleton card used while job results are loading.
 */
export const ShimmerCard = () => {
    return (
        <div className="glass rounded-2xl p-5 space-y-4">
            {/* Header row */}
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                    <ShimmerBlock height={18} width="55%" />
                    <ShimmerBlock height={13} width="35%" />
                </div>
                <ShimmerBlock height={28} width={64} rounded="rounded-full" />
            </div>

            {/* Body lines */}
            <ShimmerBlock height={12} />
            <ShimmerBlock height={12} width="75%" />

            {/* Chip row */}
            <div className="flex gap-2">
                {[80, 96, 72].map((w, i) => (
                    <ShimmerBlock key={i} height={26} width={w} rounded="rounded-lg" />
                ))}
            </div>
        </div>
    );
}