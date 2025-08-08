"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <Card className="w-full max-w-md p-6 bg-white shadow-lg rounded-lg text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-600">
            Opplastning vellykket!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Ditt finansieringsbevis er mottatt og budet ditt er registrert.
          </p>
          <p className="text-gray-600 mb-4">
            Det vil nå bli vurdert av megler. Du vil bli varslet når status
            endres.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="default"
              className="w-full sm:w-auto"
              onClick={() => router.push("/personal-info")}
            >
              Last opp nytt bud
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.push("/")}
            >
              Tilbake til start
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}