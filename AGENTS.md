<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Flyer studio architecture
- Render the personalized flyer in a browser canvas using a single prepared template asset and shared drawing function, so preview and PNG download always match.
- Process uploaded portraits only in the browser with a dynamically imported background-removal library; no photo upload or persistent storage is required.
- Keep event constants and personal-detail/photo validation in the shared flyer module, with concrete behavior tests.
