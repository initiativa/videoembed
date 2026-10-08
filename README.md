# videoembed
GLPI plugin to embed videos in any rich text area used within GLPI's objects.

## Install
To install it, download the latest release and decompress it in the plugins directory.\
Rename, if needed, the directory to `videoembed` and check that the ownership is set to the web server user (using `chown`).

## Usage
In any GLPI rich-text area a new button "video" asks for the URL of the video that should be embedded in the text.
![screenshot](assets/screenshots/editor-menu.png?raw=true "The rich-text editor menu")

## Known formats
The video URL is categorized based on the extension (as generic video file) or by domain for YouTube videos.\
Different video sharing platforms could be added in future developments but they should be trusted enough to embed an `iframe` tag in the GLPI pages.
### YouTube
Any `youtube.com` or `youtu.be` link to a video or short.\
May break on future changes in YouTube link formats.
### video file
An URL to a video file is embedded as a `video` tag in the page.\
Recognized extensions:
```
mp4
webm
ogg
ogv
mov
avi
mkv
```
### others
Unrecognized URLs are embedded as a link.
