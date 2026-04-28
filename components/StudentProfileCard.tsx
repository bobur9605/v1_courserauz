"use client";

import AccountProfileCard from "@/components/AccountProfileCard";

type Props = {
  fullName: string;
  email: string;
  age: number | null;
  gender: string | null;
  profileImageUrl: string | null;
};

export default function StudentProfileCard(props: Props) {
  return (
    <AccountProfileCard
      namespace="dashboard"
      profilePath="/api/student/profile"
      imageUploadPath="/api/student/profile/image"
      fullName={props.fullName}
      email={props.email}
      age={props.age}
      gender={props.gender}
      profileImageUrl={props.profileImageUrl}
    />
  );
}
