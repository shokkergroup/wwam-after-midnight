(function (root) {
  "use strict";

  var active = null;

  function destroy() {
    if (active) active.destroy();
    active = null;
  }

  function mount(stage, channelDNA, subjectId) {
    destroy();
    if (
      !root.ShokkerChannelPack ||
      !root.WWAM_CHANNEL_PACK_ADAPTER ||
      !root.WWAM_LONGITUDINAL_DOCKETS ||
      !root.WWAMLongitudinalDocketUI
    ) {
      return null;
    }
    var channelPack = root.ShokkerChannelPack.compile(
      channelDNA,
      root.WWAM_CHANNEL_PACK_ADAPTER
    );
    active = root.WWAMLongitudinalDocketUI.create({
      channelPack: channelPack,
      data: root.WWAM_LONGITUDINAL_DOCKETS,
      mount: stage,
      initialSubjectId: subjectId || "",
      restoreFocusOnDestroy: false,
    });
    return active.mount();
  }

  root.WWAMLongitudinalDocketDemo = Object.freeze({
    mount: mount,
    destroy: destroy,
  });
})(typeof window !== "undefined" ? window : globalThis);
