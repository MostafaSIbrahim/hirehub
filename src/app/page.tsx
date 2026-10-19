import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-8 space-y-4">
      <Card>
        <CardHeader><CardTitle>HireHub UI check</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Delete</Button>
          <Badge className="bg-highlight text-highlight-foreground">Remote</Badge>
          <Badge className="bg-success text-white">Hired</Badge>
          <Badge className="bg-warning text-black">Reviewing</Badge>
        </CardContent>
      </Card>
    </main>
  );
}