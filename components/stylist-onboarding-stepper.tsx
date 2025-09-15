"use client";

import React from "react";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { defineStepper } from "@/components/stepper";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export interface OnboardingStep {
  id: string;
  label: string;
  description?: string;
  status: "completed" | "current" | "pending";
}

interface StylistOnboardingStepperProps {
  steps: OnboardingStep[];
  className?: string;
  variant?: "horizontal" | "vertical";
  children?: React.ReactNode;
}

// Create the stepper steps from the onboarding steps
function createStepperSteps(onboardingSteps: OnboardingStep[]) {
  return onboardingSteps.map((step, index) => ({
    id: step.id,
    title: step.label,
    description: step.description,
    icon: getStepIcon(step.status),
    status: step.status,
  }));
}

function getStepIcon(status: OnboardingStep["status"]) {
  switch (status) {
    case "completed":
      return <CheckCircle className="w-4 h-4" />;
    case "current":
      return <Clock className="w-4 h-4" />;
    case "pending":
      return <AlertCircle className="w-4 h-4" />;
  }
}

export function StylistOnboardingStepper({
  steps,
  className,
  variant = "horizontal",
  children,
}: StylistOnboardingStepperProps) {
  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const currentStepIndex = steps.findIndex((step) => step.status === "current");
  const completedSteps = steps.filter((step) => step.status === "completed").length;
  const totalSteps = steps.length;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  // Use horizontal variant on large screens, vertical on small screens for better responsiveness
  const effectiveVariant = isLargeScreen ? variant : "vertical";

  // Create stepper dynamically based on onboarding steps
  const { Stepper } = React.useMemo(() => {
    const stepperSteps = createStepperSteps(steps);
    return defineStepper(...stepperSteps);
  }, [steps]);

  // Set initial step to current step or first step
  const initialStepId = steps[currentStepIndex]?.id || steps[0]?.id;

  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">
            {effectiveVariant === "horizontal" 
              ? `Steg ${currentStepIndex + 1} av ${totalSteps}`
              : `Fremgang: ${completedSteps} av ${totalSteps} fullført`
            }
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(progressPercentage)}% fullført
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <Stepper.Provider
        className="space-y-6"
        variant={effectiveVariant}
        labelOrientation="horizontal"
        initialStep={initialStepId}
      >
        {({ methods }) => (
          <>
            {/* Navigation */}
            <div className={!isLargeScreen ? "mb-6" : ""}>
              <Stepper.Navigation>
                {methods.all.map((step) => {
                  const onboardingStep = steps.find(s => s.id === step.id);
                  const stepStatus = onboardingStep?.status || "pending";
                  
                  return (
                    <Stepper.Step
                      key={step.id}
                      of={step.id}
                      icon={getStepIcon(stepStatus)}
                      className={cn(
                        !isLargeScreen ? "data-[label-orientation=vertical]:gap-2" : "",
                        stepStatus === "completed" && "text-green-700 dark:text-green-300",
                        stepStatus === "current" && "text-primary",
                        stepStatus === "pending" && "text-muted-foreground"
                      )}
                      disabled={stepStatus === "pending"}
                    >
                      <Stepper.Title 
                        className={cn(
                          "text-xs",
                          stepStatus === "completed" && "text-green-700 dark:text-green-300",
                          stepStatus === "current" && "text-foreground",
                          stepStatus === "pending" && "text-muted-foreground"
                        )}
                      >
                        {step.title}
                      </Stepper.Title>
                      {step.description && (
                        <Stepper.Description 
                          className={cn(
                            "text-xs",
                            stepStatus === "completed" && "text-green-600 dark:text-green-400",
                            stepStatus === "current" && "text-muted-foreground",
                            stepStatus === "pending" && "text-muted-foreground/70"
                          )}
                        >
                          {step.description}
                        </Stepper.Description>
                      )}
                    </Stepper.Step>
                  );
                })}
              </Stepper.Navigation>

              {/* Small/Medium screens: Show current step info below navigation */}
              {(!isLargeScreen && effectiveVariant === "horizontal") && (
                <div className="mt-4 text-center px-4">
                  {(() => {
                    const currentStepData = steps.find(
                      (step) => step.id === methods.current.id
                    );
                    return currentStepData ? (
                      <>
                        <h3 className="text-lg font-semibold">
                          {currentStepData.label}
                        </h3>
                        {currentStepData.description && (
                          <p className="text-sm text-muted-foreground">
                            {currentStepData.description}
                          </p>
                        )}
                      </>
                    ) : null;
                  })()}
                </div>
              )}
            </div>

            {/* Content area */}
            {children && (
              <div className="mt-6">
                {methods.switch(
                  Object.fromEntries(
                    steps.map(step => [
                      step.id,
                      () => (
                        <Stepper.Panel>
                          {children}
                        </Stepper.Panel>
                      )
                    ])
                  )
                )}
              </div>
            )}
          </>
        )}
      </Stepper.Provider>
    </div>
  );
}