use std::process::Command;

fn main() -> Result<(), Box<dyn std::error::Error>> {
  let release_notes = get_git_release_notes();
  let download_url_base = "https://github.com/NimbleWing/nw-fund/releases/latest/download";

  tauri_latest_json::generate_latest_json_auto(download_url_base, &release_notes)?;

  println!("✅ latest.json generated successfully");
  Ok(())
}

fn get_git_release_notes() -> String {
  let output = Command::new("git")
    .args(["log", "--format=%s", "--grep=chore", "--invert-grep", "-10"])
    .output();

  match output {
    Ok(out) => {
      if out.status.success() {
        let commits = String::from_utf8_lossy(&out.stdout);
        let notes = commits.lines().collect::<Vec<_>>().join("\n");
        if notes.is_empty() {
          "New release".to_string()
        } else {
          notes
            .lines()
            .map(|line| format!("- {}", line))
            .collect::<Vec<_>>()
            .join("\n")
        }
      } else {
        "New release".to_string()
      }
    }
    Err(_) => "New release".to_string(),
  }
}
