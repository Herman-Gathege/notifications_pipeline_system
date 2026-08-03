import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <Card className="w-[420px]">
        <CardHeader>
          <CardTitle>Notification Platform</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p>shadcn/ui is working successfully 🎉</p>

          <Button>Test Button</Button>
        </CardContent>
      </Card>
    </div>
  );
}