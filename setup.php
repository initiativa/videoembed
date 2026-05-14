<?php
declare(strict_types=1);

use Glpi\Plugin\Hooks;


const KEY = 'videoembed';
const BIG_KEY = 'Videoembed';
const NAME = 'Video Embed';
const VERSION = '1.0.0';

function plugin_init_videoembed() : void
{
	global $PLUGIN_HOOKS;

	$PLUGIN_HOOKS['csrf_compliant'][KEY] = true;

	if (!((new Plugin())->isActivated(KEY))) {
		return;
	}


	$PLUGIN_HOOKS[Hooks::ADD_JAVASCRIPT_MODULE][KEY] = [];
	$PLUGIN_HOOKS[Hooks::ADD_JAVASCRIPT_MODULE_ANONYMOUS_PAGE][KEY] = [];
	if ($_SESSION['glpi_use_mode'] === Session::DEBUG_MODE) {
		$js_debug = 'js/enable_debug.js';
		$PLUGIN_HOOKS[Hooks::ADD_JAVASCRIPT_MODULE][KEY][] = $js_debug;
		$PLUGIN_HOOKS[Hooks::ADD_JAVASCRIPT_MODULE_ANONYMOUS_PAGE][KEY][] = $js_debug;
	}
	$js_script = 'js/video_embed.js';
	$PLUGIN_HOOKS[Hooks::ADD_JAVASCRIPT_MODULE][KEY][] = $js_script;
	$PLUGIN_HOOKS[Hooks::ADD_JAVASCRIPT_MODULE_ANONYMOUS_PAGE][KEY][] = $js_script;
}

function plugin_version_videoembed() : array
{
	return [
	  'name' => NAME,
	  'version' => VERSION,
	  'author' => 'Pietro Lepori - initiativa s.r.l.',
	  'license' => 'GNU General Public License v3.0',
	  'requirements' => ['glpi' => ['min' => '11.0.0']],
	];
}

function plugin_videoembed_check_prerequisites() : bool
{
	return true;
}

function plugin_videoembed_check_config(bool $verbose = false) : bool
{
	return true;
}
