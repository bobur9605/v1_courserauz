"use client";

import { useCallback, useState } from "react";
import { CourseResourcesList } from "@/components/CourseResourcesList";
import { ResourceUploadForm } from "@/components/ResourceUploadForm";

type Props = { courseId: string };

export function TeacherResourcesSection({ courseId }: Props) {
  const [rev, setRev] = useState(0);
  const bump = useCallback(() => setRev((n) => n + 1), []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ResourceUploadForm courseId={courseId} onUploaded={bump} />
      <CourseResourcesList
        key={rev}
        courseId={courseId}
        canManage
        onChanged={bump}
      />
    </div>
  );
}
