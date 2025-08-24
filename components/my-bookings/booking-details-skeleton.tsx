import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { BlurFade } from "@/components/magicui/blur-fade";

export function BookingDetailsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <BlurFade delay={0.1} duration={0.5} inView>
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32" />
          </div>
        </BlurFade>

        {/* Main Info Card */}
        <BlurFade delay={0.15} duration={0.5} inView>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Description */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <Skeleton className="h-4 w-full" />
              </div>

              {/* DateTime and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Stylist Info */}
        <BlurFade delay={0.2} duration={0.5} inView>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-4 h-4" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-4 h-4" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </div>
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Services */}
        <BlurFade delay={0.25} duration={0.5} inView>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2].map((_, index) => (
                  <div key={index} className="space-y-3">
                    {index > 0 && <div className="h-px bg-border" />}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Message to Stylist */}
        <BlurFade delay={0.3} duration={0.5} inView>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-6 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Pricing Summary */}
        <BlurFade delay={0.35} duration={0.5} inView>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-6 w-28" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2].map((_, index) => (
                  <div key={index} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}

                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>

                {/* Payment Status */}
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* Chat Link */}
        <BlurFade delay={0.4} duration={0.5} inView>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-6 w-12" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </BlurFade>
      </div>
    </div>
  );
}