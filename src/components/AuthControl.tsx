"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "./ui/Button";
import styles from "./AuthControl.module.css";

export function AuthControl() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  if (session?.user) {
    return (
      <div className={styles.control}>
        <span className={styles.email}>{session.user.email}</span>
        <Button variant="soft" onClick={() => signOut()}>
          Se deconnecter
        </Button>
      </div>
    );
  }

  return (
    <Button variant="soft" onClick={() => signIn("google")}>
      Espace editeur
    </Button>
  );
}
