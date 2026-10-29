# Triage labels

## Scope

The label strings the `triage` skill and the skills around it apply on GitHub issues.

## Rules

The skills name five roles. In this repository each label has the same name as its role:

| Role              | Label             | Meaning                                   |
| ----------------- | ----------------- | ----------------------------------------- |
| `needs-triage`    | `needs-triage`    | The owner needs to evaluate the issue     |
| `needs-info`      | `needs-info`      | Waiting on the reporter for more details  |
| `ready-for-agent` | `ready-for-agent` | Fully specified, an agent can do it alone |
| `ready-for-human` | `ready-for-human` | Needs a person to do it                   |
| `wontfix`         | `wontfix`         | Won't be done                             |

`wontfix` already exists. A skill creates the other four the first time it applies them.

## References

- [Issue tracker](issue-tracker.md): the `gh` commands for labels and issues.
