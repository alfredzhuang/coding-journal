FilePond.registerPlugin(
    FilePondPluginImagePreview,
    FilePondPluginImageResize,
    FilePondPluginFileEncode,
)

FilePond.setOptions({
    imageResizeTargetWidth: 225,
    imageResizeTargetHeight: 100
})

FilePond.parse(document.body);