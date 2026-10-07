
// Debug console logger
function debugLog(...args) {
	if (window.VIDEOEMBED_DEBUG) {
		console.log('[video_embed]', ...args);
	}
}


// Register TinyMCE plugin

tinymce.PluginManager.add('video_embed', (editor) => {
	editor.ui.registry.addButton('video_embed', {
		text: 'video',
		tooltip: 'Insert video link to embed',
		onAction() {
			const url = prompt('Video URL:').trim();
			if (!url) return;
			editor.insertContent(`[video_embed:${encodeURI(url)}]`);	// encodeURIComponent ?
		},
	});

	return {getMetadata: () => ({name: 'Video Embed', url: '', version: '1.0'})};	// TODO
});


// Intercept tinymce.init to inject plugin + button

// This runs before jQuery ready, so it's in place before tinyMCE.init() is called
const _original_tinymce_init = tinymce.init.bind(tinymce);
tinymce.init = function (config) {
	if (Array.isArray(config.plugins)) {
		config.plugins.push('video_embed');
	} else {
		config.plugins = (config.plugins ?? '') + ' video_embed';
	}

	// classic toolbar
	if (typeof config.toolbar === 'string') {
		config.toolbar += ' | video_embed';
	}
	// inline layout toolbars
	if (typeof config.quickbars_insert_toolbar === 'string') {
		config.quickbars_insert_toolbar += ' | video_embed';
	}
	if (typeof config.contextmenu === 'string') {
		config.contextmenu += ' | video_embed';
	}

	const originalSetup = config.setup;
	config.setup = function (editor) {
		if (typeof originalSetup === 'function') {
			originalSetup.call(this, editor);
		}
		// any additional per-editor setup can go here
	};

	return _original_tinymce_init(config);
};


// Decode URL functions

function extractYouTubeId(url) {
	const match = url.match(
		/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
		);
	return match ? match[1] : null;
}

const VIDEO_EXTENSIONS = {
	mp4:	'video/mp4',
	webm:	'video/webm',
	ogg:	'video/ogg',
	ogv:	'video/ogg',
	mov:	'video/quicktime',
	avi:	'video/x-msvideo',
	mkv:	'video/x-matroska',
};

function extractVideoMimeType(url) {
	// strip query string and fragment before checking the extension
	const path = url.split('?')[0].split('#')[0];
	const ext = path.split('.').pop().toLowerCase();
	return VIDEO_EXTENSIONS[ext] ?? null;
}


// Replace placeholders in the DOM

function replaceVideoEmbedPlaceholders(root = document) {
	// only target read-only display containers, no editor inputs
	// 'div.rich_text_container' should be the class used in all GLPI templates for rendered (sanitized) rich text output
	root.querySelectorAll('div.rich_text_container').forEach(doVideoEmbedPlaceholdersReplacement);
}

function buildYouTubeEmbed(videoId) {
	const wrapper = document.createElement('div');
	wrapper.style.cssText =
		'position:relative;overflow:hidden;margin:1em 0';
	const iframe = document.createElement('iframe');
	iframe.src = `https://www.youtube.com/embed/${videoId}`;
	iframe.title = "YouTube video player";
//	iframe.allow =
//		'accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture';
	iframe.allow = 'encrypted-media;gyroscope;picture-in-picture';
	iframe.allowFullscreen = true;
	iframe.width = 560;
	iframe.height = 315;
	iframe.frameborder = 0;
	iframe.referrerpolicy = "strict-origin-when-cross-origin";
	wrapper.appendChild(iframe);
	return wrapper;
}

function buildVideoEmbed(url, mimeType) {
	const video = document.createElement('video');
	video.controls = true;
	video.width = 560;
	video.height = 315;
	video.style.cssText =
		'position:relative;overflow:hidden;margin:1em 0';
	const source = document.createElement('source');
	source.src = url;
	source.type = mimeType;
	video.appendChild(source);
	// fallback text for browsers that don't support the video element
	video.appendChild(document.createTextNode('Your browser does not support the video tag.'));
	video.appendChild(document.createTextNode('Visit: ' + url));
	return video;
}

function buildLinkEmbed(url) {
	const a = document.createElement('a');
	a.href = url;
	a.textContent = url;
	a.target = '_blank';
	a.rel = 'noopener noreferrer';
	return a;
}

function doVideoEmbedPlaceholdersReplacement(root) {
	const PATTERN = /\[video_embed:([^\]]+)\]/g;

	const walker = document.createTreeWalker(root, NodeFilter.SHOW_ALL, {
		acceptNode(node) {
			if (node.nodeType === Node.ELEMENT_NODE) {
				// prune the TinyMCE subtree
				if (node.matches('textarea')) {
					return NodeFilter.FILTER_REJECT;
				}
				// skip but visit their children
				return NodeFilter.FILTER_SKIP;
			}
			// accept text nodes
			return NodeFilter.FILTER_ACCEPT;
		}
	});

	const hits = [];
	let node;
	while ((node = walker.nextNode())) {
		if (PATTERN.test(node.nodeValue))
			hits.push(node);
		PATTERN.lastIndex = 0;
	}

	for (const textNode of hits) {
		const fragment = document.createDocumentFragment();
		let last = 0, m;
		PATTERN.lastIndex = 0;

		while ((m = PATTERN.exec(textNode.nodeValue)) !== null) {
			if (m.index > last) {
				fragment.appendChild(
					document.createTextNode(textNode.nodeValue.slice(last, m.index))
				);
			}

//			const url = decodeURIComponent(m[1]);
			const url = m[1];
			const youtubeId = extractYouTubeId(url);
			const mimeType = extractVideoMimeType(url);

			if (youtubeId) {
				debugLog("found YouTube link");
				fragment.appendChild(buildYouTubeEmbed(youtubeId));
			} else if (mimeType) {
				debugLog("found video file");
				fragment.appendChild(buildVideoEmbed(url, mimeType));
			} else {
				debugLog("found unknown link");
				fragment.appendChild(buildLinkEmbed(url));
			}

			last = m.index + m[0].length;
		}

		if (last < textNode.nodeValue.length) {
			fragment.appendChild(
				document.createTextNode(textNode.nodeValue.slice(last))
			);
		}

		textNode.parentNode.replaceChild(fragment, textNode);
	}
}


// Run in page
document.addEventListener('DOMContentLoaded', () => {
		debugLog("register");
		setTimeout(() => {
			debugLog("enter");
			replaceVideoEmbedPlaceholders();
			debugLog("done");
		}, 500);
	}
);


// Run in tabs
$(document).on('glpi.tab.loaded', function (e) {
	debugLog("tab-enter");
	replaceVideoEmbedPlaceholders(e.target);
	debugLog("tab-done");
});
