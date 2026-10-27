# Kishore & Abbrinna | Wedding Invitation Website

Mobile-first wedding invitation. Tap the wax seal, the doors open, and every section after that is drawn and revealed as you scroll.

## Files

```
index.html            all content (English + Tamil)
css/style.css         colours, fonts, layout
js/art.js             gold line-art (jasmine, lotus, thoranam, lamp, frames)
js/main.js            card opening, scroll animations, calendar, countdown, RSVP
js/monogram.js        K & A monogram outlines
js/vendor/            GSAP, ScrollTrigger, DrawSVG, Lenis (offline copies)
assets/fonts/         Playfair Display, Unbounded, Crimson Pro, Noto Serif Tamil
assets/audio/         put music.mp3 here (optional)
assets/og-image.jpg   WhatsApp / social preview image
```

## Preview on your Mac

Open the folder in Terminal and run:

```
cd ~/"Kishore Anna Invitation"
python3 -m http.server 8000
```

Open http://localhost:8000 in Chrome, press Cmd+Option+I, then click the phone icon to see the mobile view.

## Add music

Save the song as `assets/audio/music.mp3`. The music button appears automatically and the song starts when the seal is tapped.

## Tamil link

Share `your-link/?lang=ta` and the site opens straight in Tamil. Guests can also switch with the button at the top.

## Put it online (free)

1. Go to https://app.netlify.com/drop
2. Drag the whole `Kishore Anna Invitation` folder onto the page
3. Netlify gives you a link. In Site settings you can rename it, e.g. `kishore-weds-abbrinna.netlify.app`
4. In `index.html`, change `og:image` to the full link, e.g. `https://kishore-weds-abbrinna.netlify.app/assets/og-image.jpg`, then drag the folder again. Now WhatsApp shows the preview image.

## Editing details

- Text: search for it in `index.html`. English sits in `class="en"`, Tamil in `class="ta"`.
- RSVP WhatsApp number: `WHATSAPP` in `js/main.js` (now 917010933178); the Call button in `index.html` uses the same number.
- Countdown time: `target` in `js/main.js` (now 22 Nov 2026, 10.00 am IST).
- Colours: the `:root` block at the top of `css/style.css`.
