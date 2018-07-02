// ==========================================================================
// Plyr HTML5 helpers
// ==========================================================================

import controls from './../controls';
import is from './../utils/is';
import { createElement, replaceElement } from '../utils/elements';
import { triggerEvent } from './../utils/events';
import loadScript from '../utils/loadScript';

const hls = {
    // Get quality levels
    getQualityOptions(levels) {
        const qualityLevels = [{
            label: 'Default',
            height: 0,
            badge: '',
        }];
        qualityLevels.push(...levels.map(level => ({
            height: level.height,
        })));
        return qualityLevels;
    },

    setup() {
        // Setup API
        if (window.Hls) {
            hls.ready.call(this);
        } else {
            // Load the API
            loadScript(this.config.urls.hls).then(() => {
                hls.ready.call(this);
            }).catch(error => {
                this.debug.warn('HLS API failed to load', error);
            });
        }
    },
    ready() {
        const player = this;
        let source = player.media.getAttribute('src');
        // Get from <div> if needed
        if (is.empty(source)) {
            source = player.media.getAttribute(player.config.attributes.embed.id);
        }

        const { poster } = player;

        const container = createElement('video', { source, poster });
        player.media = replaceElement(container, player.media);

        const hlsInstance = new window.Hls();
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(player.media);
        player.media.setAttribute('currentSrc', source);

        player.embed = hlsInstance;

        player.embed.once(window.Hls.Events.MANIFEST_PARSED, () => {
            const qualityLevels = hls.getQualityOptions(player.embed.levels);
            // Pass through any relevant events here
            Object.defineProperty(player.media, 'quality', {
                get() {
                    return player.options.quality.find(e => e.index === player.embed.currentLevel).label;
                },
                set(input) {
                    player.embed.currentLevel = input.index;
                    triggerEvent.call(player, player.media, 'qualitychange', false, {
                        quality: input,
                    });
                },
            });
            controls.setQualityMenu.call(
                player,
                qualityLevels,
            );
        });
    },
};

export default hls;
