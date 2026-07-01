# Blocs HTML libres dans l’admin article

## Ajouter un bloc HTML / widget

Dans l’éditeur d’un article, placez le curseur à l’endroit voulu dans le contenu puis cliquez sur **Ajouter un bloc HTML**. Collez le markup HTML du widget dans la zone dédiée, puis validez avec **Insérer le bloc à la position du curseur**.

Le bloc est enregistré dans le contenu HTML de l’article (`contentJson.html` et `contentHtml`) sous forme d’un conteneur identifié par `data-admin-html-block="html"`. Cela évite de modifier le modèle backend et conserve la compatibilité avec les articles WordPress importés qui utilisent déjà `contentHtml`.

## Modifier, supprimer ou déplacer un bloc

Pour modifier un bloc existant, cliquez dans le bloc dans l’éditeur, puis utilisez **Modifier bloc HTML**. Les boutons **Supprimer bloc HTML**, **Monter bloc** et **Descendre bloc** agissent aussi sur le bloc actuellement sélectionné.

## Widgets GetYourGuide

Pour un widget GetYourGuide, collez uniquement le markup du widget, par exemple le `<div ...>` fourni par GetYourGuide. Le script global GetYourGuide ne doit pas être collé dans le bloc et ne doit pas être ajouté plusieurs fois.

Le script officiel doit rester chargé côté layout/front avec :

```html
<script async src="https://widget.getyourguide.com/dist/pa.umd.production.min.js" data-gyg-partner-id="32QOCNG"></script>
```

## Sécurité et limites

L’admin accepte du HTML libre pour permettre les widgets éditoriaux, mais il ne doit pas exécuter de scripts arbitraires :

- les balises `<script>` collées dans un bloc sont supprimées avant insertion ;
- les attributs d’événement inline comme `onclick` sont supprimés ;
- les URLs `javascript:` sur `href` et `src` sont supprimées ;
- les attributs `data-*`, nécessaires notamment à GetYourGuide, sont conservés.

Côté public, l’article est rendu avec le même rendu HTML que `contentHtml`, via le rendu contrôlé du contenu éditorial. Les extensions WordPress ne sont pas exécutées : seuls les HTML déjà importés ou saisis dans l’admin sont affichés, et les shortcodes/extensions PHP WordPress ne tournent pas dans l’application Next.js.
