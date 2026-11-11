import React from "react";
import StreamingText from "@/components/ui/streaming-text";
import { MessageLoading } from "@/components/ui/message-loading";

export function MessageLoadingDemo() {
  return (
    <div className="block p-4">
      <MessageLoading />
    </div>
  );
}

export default function StreamingTextDemo() {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center bg-background p-8">
      <StreamingText />
    </div>
  );
}

export { StreamingTextDemo };
