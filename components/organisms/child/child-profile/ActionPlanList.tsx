"use client";
import React from "react";
import { formatNepaliDate } from "@/lib/nepaliDate";

const priorityColors = {
  LOW: "bg-text-muted/10 text-text-muted border-border",
  MEDIUM: "bg-primary/10 text-primary border-primary/20",
  HIGH: "bg-warning/10 text-warning border-warning/20",
  URGENT: "bg-danger/10 text-danger border-danger/30 animate-pulse"
};

const statusColors = {
  COMPLETED: "bg-success/10 text-success border-success/20",
  DEFAULT: "bg-text-muted/10 text-text-muted border-border"
};

export const ActionPlanList = ({ tasks }: { tasks: any[] }) => {
  return (
    <div className="flex flex-col gap-3">

      {tasks.map((task) => (
        <div
          key={task._id}
          className="
            bg-card
            border border-border
            p-4 rounded-xl
            shadow-sm hover:shadow-md
            transition-all
          "
        >

          {/* TOP ROW */}
          <div className="flex justify-between items-start mb-2">

            <span
              className={`
                text-[10px] font-black px-2 py-0.5 rounded-full border
                ${priorityColors[task.priority as keyof typeof priorityColors]}
              `}
            >
              {task.priority}
            </span>

            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {task.category}
            </span>

          </div>

          {/* TITLE */}
          <h4 className="font-bold text-text text-sm">
            {task.title}
          </h4>

          {/* DESCRIPTION */}
          {task.description && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* FOOTER */}
          <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">

            <div className="text-[10px] text-text-muted font-medium">
              Due:{" "}
              {task.dueDate
                ? formatNepaliDate(task.dueDate)
                : "No deadline"}
            </div>

            <div
              className={`
                text-[10px] font-bold px-2 py-1 rounded border
                ${
                  task.status === "COMPLETED"
                    ? statusColors.COMPLETED
                    : statusColors.DEFAULT
                }
              `}
            >
              {task.status}
            </div>

          </div>
        </div>
      ))}

      {/* EMPTY STATE */}
      {tasks.length === 0 && (
        <div className="
          text-center py-10
          bg-card
          rounded-xl
          border border-dashed border-border
        ">
          <p className="text-xs text-text-muted font-medium italic">
            No active needs logged for this child.
          </p>
        </div>
      )}

    </div>
  );
};