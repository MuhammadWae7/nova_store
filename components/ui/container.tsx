import * as React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

const Container: React.FC<ContainerProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Container }
