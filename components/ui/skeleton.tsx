import { cn } from '@/lib/utils/cn'

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-md bg-muted',
                'before:absolute before:inset-0',
                'before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent',
                'before:animate-[shimmer_1.5s_ease-in-out_infinite]',
                className,
            )}
            {...props}
        />
    )
}

export { Skeleton }
