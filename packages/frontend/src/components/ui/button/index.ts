import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

export const buttonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-150 gap-2 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				default:
					"text-main-foreground bg-gradient-to-b from-[oklch(78%_0.18_85)] to-main border border-[oklch(65%_0.15_85)] border-t-[oklch(85%_0.12_85)] shadow-[0_2px_8px_-2px_oklch(10%_0.01_260),inset_0_1px_0_oklch(100%_0_0/0.2)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_-2px_oklch(10%_0.01_260),inset_0_1px_0_oklch(100%_0_0/0.25)] active:translate-y-0.5 active:shadow-[0_1px_4px_-1px_oklch(10%_0.01_260)]",
				noShadow:
					"text-main-foreground bg-gradient-to-b from-[oklch(78%_0.18_85)] to-main border border-[oklch(65%_0.15_85)] border-t-[oklch(85%_0.12_85)]",
				neutral:
					"bg-gradient-to-b from-[oklch(35%_0.02_260)] to-secondary-background text-foreground border border-border/50 border-t-[oklch(100%_0_0/0.1)] shadow-[0_2px_8px_-2px_oklch(10%_0.01_260),inset_0_1px_0_oklch(100%_0_0/0.1)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_-2px_oklch(10%_0.01_260)] active:translate-y-0.5",
				reverse:
					"text-main-foreground bg-gradient-to-b from-[oklch(78%_0.18_85)] to-main border border-[oklch(65%_0.15_85)] border-t-[oklch(85%_0.12_85)] hover:-translate-y-0.5 active:translate-y-0.5",
				ghost:
					"text-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 px-3",
				lg: "h-11 px-8",
				icon: "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
