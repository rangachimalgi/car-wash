import React from 'react'
import { useAdminPanelContext } from '../../context/AdminPanelContext'

export default function MediaTab() {
  const { deleteMediaItem, fetchMedia, homeSliderMediaForm, loadingMedia, loginBannerMediaForm, mediaFileInputKey, mediaList, mediaMessage, mediaPosterInputKey, message, orders, resolveUploadOrAbsoluteUrl, seeDiffMediaForm, setHomeSliderMediaForm, setLoginBannerMediaForm, setMediaMessage, setSeeDiffMediaForm, setTestimonialMediaForm, setTransformationMediaForm, setWhyChooseMediaForm, testimonialMediaForm, transformationMediaForm, uploadMediaFile, uploadingMedia, whyChooseMediaForm } = useAdminPanelContext()

  return (
      <div className="media-page">
        <div className="orders-section media-section">
        <div className="section-header media-header">
          <div>
            <h2 className="section-title media-title">Media</h2>
            <p className="media-subtitle">Manage testimonials, transformations, homepage and login visuals, and Why Choose Woosh cards</p>
          </div>
          <button type="button" className="secondary-button media-refresh-button" onClick={fetchMedia} disabled={loadingMedia}>
            {loadingMedia ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        {mediaMessage.text && (
          <div className={`media-message ${mediaMessage.type === 'error' ? 'media-message-error' : 'media-message-success'}`}>
            {mediaMessage.text}
          </div>
        )}


        {/* Home hero slider images */}
        <div className="media-block">
          <h3 className="media-block-title">Home hero slider</h3>
          <p className="media-help-text">Max image size: {MAX_MEDIA_IMAGE_SIZE_MB} MB. One image per upload; order matches carousel. If none are uploaded, the app uses built-in banners.</p>
          <div className="media-upload-toolbar">
            <input
              type="text"
              placeholder="Label (optional)"
              value={homeSliderMediaForm.name}
              onChange={(e) => setHomeSliderMediaForm((f) => ({ ...f, name: e.target.value }))}
              className="media-control media-name-input"
            />
            <label className="media-file-input-wrap">
              <span className="media-file-button">Choose image</span>
              <input
                key={`media-file-homeSliders-${mediaFileInputKey.homeSliders}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (file && file.size > MAX_MEDIA_IMAGE_SIZE_BYTES) {
                    const msg = `Size limit exceeded. Max allowed is ${MAX_MEDIA_IMAGE_SIZE_MB} MB per image.`
                    setMediaMessage({ type: 'error', text: msg })
                    window.alert(msg)
                    e.target.value = ''
                    return
                  }
                  setHomeSliderMediaForm((f) => ({ ...f, file }))
                }}
              />
            </label>
            <span className="media-selected-file">{homeSliderMediaForm.file?.name || 'No file selected'}</span>
            <button
              type="button"
              className="media-upload-button"
              onClick={() => uploadMediaFile('homeSliders', homeSliderMediaForm, setHomeSliderMediaForm)}
              disabled={uploadingMedia || !homeSliderMediaForm.file}
            >
              {uploadingMedia ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <div className="media-items-grid">
            {(mediaList.filter((m) => m.type === 'homeSliders') || []).sort((a, b) => a.order - b.order).map((m) => (
              <div key={m._id} className="media-item-card">
                <img src={resolveUploadOrAbsoluteUrl(m.url)} alt="" className="media-item-preview" />
                <span className="media-item-name">{m.name?.trim() ? m.name : `Slide ${m.order + 1}`}</span>
                <button type="button" className="secondary-button media-delete-button" onClick={() => deleteMediaItem(m._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>


        {/* Login screen banner */}
        <div className="media-block">
          <h3 className="media-block-title">Login screen banner</h3>
          <p className="media-help-text">
            Max image size: {MAX_MEDIA_IMAGE_SIZE_MB} MB. The first image (lowest order) is shown on the customer app login screen. If none are uploaded, the app uses the built-in banner.
          </p>
          <div className="media-upload-toolbar">
            <input
              type="text"
              placeholder="Label (optional)"
              value={loginBannerMediaForm.name}
              onChange={(e) => setLoginBannerMediaForm((f) => ({ ...f, name: e.target.value }))}
              className="media-control media-name-input"
            />
            <label className="media-file-input-wrap">
              <span className="media-file-button">Choose image</span>
              <input
                key={`media-file-loginBanner-${mediaFileInputKey.loginBanner}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (file && file.size > MAX_MEDIA_IMAGE_SIZE_BYTES) {
                    const msg = `Size limit exceeded. Max allowed is ${MAX_MEDIA_IMAGE_SIZE_MB} MB per image.`
                    setMediaMessage({ type: 'error', text: msg })
                    window.alert(msg)
                    e.target.value = ''
                    return
                  }
                  setLoginBannerMediaForm((f) => ({ ...f, file }))
                }}
              />
            </label>
            <span className="media-selected-file">{loginBannerMediaForm.file?.name || 'No file selected'}</span>
            <button
              type="button"
              className="media-upload-button"
              onClick={() => uploadMediaFile('loginBanner', loginBannerMediaForm, setLoginBannerMediaForm)}
              disabled={uploadingMedia || !loginBannerMediaForm.file}
            >
              {uploadingMedia ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <div className="media-items-grid">
            {(mediaList.filter((m) => m.type === 'loginBanner') || []).sort((a, b) => a.order - b.order).map((m) => (
              <div key={m._id} className="media-item-card">
                <img src={resolveUploadOrAbsoluteUrl(m.url)} alt="" className="media-item-preview" />
                <span className="media-item-name">
                  {m.order === 0 ? 'Active on login' : m.name?.trim() ? m.name : `Banner ${m.order + 1}`}
                </span>
                <button type="button" className="secondary-button media-delete-button" onClick={() => deleteMediaItem(m._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>


        {/* Why Choose Woosh cards */}
        <div className="media-block">
          <h3 className="media-block-title">Why Choose Woosh</h3>
          <p className="media-help-text">
            Max image size: {MAX_MEDIA_IMAGE_SIZE_MB} MB. Each card needs a title, description, and image. Order matches the home screen carousel. If none are uploaded, the app uses built-in cards.
          </p>
          <div className="media-upload-toolbar">
            <input
              type="text"
              placeholder="Title (required)"
              value={whyChooseMediaForm.title}
              onChange={(e) => setWhyChooseMediaForm((f) => ({ ...f, title: e.target.value }))}
              className="media-control media-name-input"
            />
            <input
              type="text"
              placeholder="Description (required)"
              value={whyChooseMediaForm.description}
              onChange={(e) => setWhyChooseMediaForm((f) => ({ ...f, description: e.target.value }))}
              className="media-control media-name-input media-description-input"
            />
            <label className="media-file-input-wrap">
              <span className="media-file-button">Choose image</span>
              <input
                key={`media-file-whyChooseUs-${mediaFileInputKey.whyChooseUs}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (file && file.size > MAX_MEDIA_IMAGE_SIZE_BYTES) {
                    const msg = `Size limit exceeded. Max allowed is ${MAX_MEDIA_IMAGE_SIZE_MB} MB per image.`
                    setMediaMessage({ type: 'error', text: msg })
                    window.alert(msg)
                    e.target.value = ''
                    return
                  }
                  setWhyChooseMediaForm((f) => ({ ...f, file }))
                }}
              />
            </label>
            <span className="media-selected-file">{whyChooseMediaForm.file?.name || 'No file selected'}</span>
            <button
              type="button"
              className="media-upload-button"
              onClick={() => uploadMediaFile('whyChooseUs', whyChooseMediaForm, setWhyChooseMediaForm)}
              disabled={
                uploadingMedia ||
                !whyChooseMediaForm.file ||
                !whyChooseMediaForm.title?.trim() ||
                !whyChooseMediaForm.description?.trim()
              }
            >
              {uploadingMedia ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <div className="media-items-grid">
            {(mediaList.filter((m) => m.type === 'whyChooseUs') || []).sort((a, b) => a.order - b.order).map((m) => (
              <div key={m._id} className="media-item-card media-item-card-why-choose">
                <img src={resolveUploadOrAbsoluteUrl(m.url)} alt="" className="media-item-preview" />
                <span className="media-item-name">{m.title?.trim() || `Card ${m.order + 1}`}</span>
                {m.description?.trim() ? (
                  <span className="media-item-description">{m.description}</span>
                ) : null}
                <button type="button" className="secondary-button media-delete-button" onClick={() => deleteMediaItem(m._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>


        {/* Testimonials: video upload */}
        <div className="media-block">
          <h3 className="media-block-title">Customer Testimonials (videos)</h3>
          <p className="media-help-text">
            Max video size: {MAX_MEDIA_VIDEO_SIZE_MB} MB. Upload a thumbnail image (recommended) for the app carousel.
          </p>
          <div className="media-upload-toolbar">
            <input
              type="text"
              placeholder="Name (optional)"
              value={testimonialMediaForm.name}
              onChange={(e) => setTestimonialMediaForm((f) => ({ ...f, name: e.target.value }))}
              className="media-control media-name-input"
            />
            <label className="media-file-input-wrap">
              <span className="media-file-button">Choose video</span>
              <input
                key={`media-file-testimonials-${mediaFileInputKey.testimonials}`}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (file && file.size > MAX_MEDIA_VIDEO_SIZE_BYTES) {
                    const msg = `Size limit exceeded. Max allowed is ${MAX_MEDIA_VIDEO_SIZE_MB} MB per video.`
                    setMediaMessage({ type: 'error', text: msg })
                    window.alert(msg)
                    e.target.value = ''
                    return
                  }
                  setTestimonialMediaForm((f) => ({ ...f, file }))
                }}
              />
            </label>
            <label className="media-file-input-wrap">
              <span className="media-file-button">Choose thumbnail</span>
              <input
                key={`media-poster-testimonials-${mediaPosterInputKey.testimonials}`}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const posterFile = e.target.files?.[0] || null
                  if (posterFile && posterFile.size > MAX_MEDIA_IMAGE_SIZE_BYTES) {
                    const msg = `Thumbnail too large. Max ${MAX_MEDIA_IMAGE_SIZE_MB} MB.`
                    setMediaMessage({ type: 'error', text: msg })
                    window.alert(msg)
                    e.target.value = ''
                    return
                  }
                  setTestimonialMediaForm((f) => ({ ...f, posterFile }))
                }}
              />
            </label>
            <span className="media-selected-file">
              {testimonialMediaForm.file?.name || 'No video'}
              {testimonialMediaForm.posterFile?.name ? ` · thumb: ${testimonialMediaForm.posterFile.name}` : ''}
            </span>
            <button
              type="button"
              className="media-upload-button"
              onClick={() => uploadMediaFile('testimonials', testimonialMediaForm, setTestimonialMediaForm)}
              disabled={uploadingMedia || !testimonialMediaForm.file}
            >
              {uploadingMedia ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <div className="media-items-grid">
            {(mediaList.filter((m) => m.type === 'testimonials') || []).map((m) => (
              <div key={m._id} className="media-item-card">
                {m.posterUrl ? (
                  <img src={resolveUploadOrAbsoluteUrl(m.posterUrl)} alt="" className="media-item-preview" />
                ) : m.url.match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={resolveUploadOrAbsoluteUrl(m.url)} controls className="media-item-preview" />
                ) : (
                  <img src={resolveUploadOrAbsoluteUrl(m.url)} alt="" className="media-item-preview" />
                )}
                <span className="media-item-name">{m.name || 'Video'}</span>
                <button type="button" className="secondary-button media-delete-button" onClick={() => deleteMediaItem(m._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>


        {/* Transformations: video upload (same form, type=transformations) - list below */}
        <div className="media-block">
          <h3 className="media-block-title">See The Transformations (videos)</h3>
          <p className="media-help-text">
            Max video size: {MAX_MEDIA_VIDEO_SIZE_MB} MB. Upload a thumbnail image (recommended) for the app carousel.
          </p>
          <div className="media-upload-toolbar">
            <input
              type="text"
              placeholder="Name (optional)"
              value={transformationMediaForm.name}
              onChange={(e) => setTransformationMediaForm((f) => ({ ...f, name: e.target.value }))}
              className="media-control media-name-input"
            />
            <label className="media-file-input-wrap">
              <span className="media-file-button">Choose video</span>
              <input
                key={`media-file-transformations-${mediaFileInputKey.transformations}`}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (file && file.size > MAX_MEDIA_VIDEO_SIZE_BYTES) {
                    const msg = `Size limit exceeded. Max allowed is ${MAX_MEDIA_VIDEO_SIZE_MB} MB per video.`
                    setMediaMessage({ type: 'error', text: msg })
                    window.alert(msg)
                    e.target.value = ''
                    return
                  }
                  setTransformationMediaForm((f) => ({ ...f, file }))
                }}
              />
            </label>
            <label className="media-file-input-wrap">
              <span className="media-file-button">Choose thumbnail</span>
              <input
                key={`media-poster-transformations-${mediaPosterInputKey.transformations}`}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const posterFile = e.target.files?.[0] || null
                  if (posterFile && posterFile.size > MAX_MEDIA_IMAGE_SIZE_BYTES) {
                    const msg = `Thumbnail too large. Max ${MAX_MEDIA_IMAGE_SIZE_MB} MB.`
                    setMediaMessage({ type: 'error', text: msg })
                    window.alert(msg)
                    e.target.value = ''
                    return
                  }
                  setTransformationMediaForm((f) => ({ ...f, posterFile }))
                }}
              />
            </label>
            <span className="media-selected-file">
              {transformationMediaForm.file?.name || 'No video'}
              {transformationMediaForm.posterFile?.name ? ` · thumb: ${transformationMediaForm.posterFile.name}` : ''}
            </span>
            <button
              type="button"
              className="media-upload-button"
              onClick={() => uploadMediaFile('transformations', transformationMediaForm, setTransformationMediaForm)}
              disabled={uploadingMedia || !transformationMediaForm.file}
            >
              {uploadingMedia ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <div className="media-items-grid">
            {(mediaList.filter((m) => m.type === 'transformations') || []).map((m) => (
              <div key={m._id} className="media-item-card">
                {m.posterUrl ? (
                  <img src={resolveUploadOrAbsoluteUrl(m.posterUrl)} alt="" className="media-item-preview" />
                ) : m.url.match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={resolveUploadOrAbsoluteUrl(m.url)} controls className="media-item-preview" />
                ) : (
                  <img src={resolveUploadOrAbsoluteUrl(m.url)} alt="" className="media-item-preview" />
                )}
                <span className="media-item-name">{m.name || 'Video'}</span>
                <button type="button" className="secondary-button media-delete-button" onClick={() => deleteMediaItem(m._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>


        {/* See The Difference: images (one at a time, like testimonials) */}
        <div className="media-block">
          <h3 className="media-block-title">See The Difference (images)</h3>
          <p className="media-help-text">Max image size: {MAX_MEDIA_IMAGE_SIZE_MB} MB each. Upload one at a time; order follows upload sequence.</p>
          <div className="media-upload-toolbar">
            <input
              type="text"
              placeholder="Caption (optional)"
              value={seeDiffMediaForm.name}
              onChange={(e) => setSeeDiffMediaForm((f) => ({ ...f, name: e.target.value }))}
              className="media-control media-name-input"
            />
            <label className="media-file-input-wrap">
              <span className="media-file-button">Choose image</span>
              <input
                key={`media-file-seeTheDifference-${mediaFileInputKey.seeTheDifference}`}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (file && file.size > MAX_MEDIA_IMAGE_SIZE_BYTES) {
                    const msg = `Size limit exceeded. Max allowed is ${MAX_MEDIA_IMAGE_SIZE_MB} MB per image.`
                    setMediaMessage({ type: 'error', text: msg })
                    window.alert(msg)
                    e.target.value = ''
                    return
                  }
                  setSeeDiffMediaForm((f) => ({ ...f, file }))
                }}
              />
            </label>
            <span className="media-selected-file">{seeDiffMediaForm.file?.name || 'No file selected'}</span>
            <button
              type="button"
              className="media-upload-button"
              onClick={() => uploadMediaFile('seeTheDifference', seeDiffMediaForm, setSeeDiffMediaForm)}
              disabled={uploadingMedia || !seeDiffMediaForm.file}
            >
              {uploadingMedia ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <div className="media-items-grid">
            {(mediaList.filter((m) => m.type === 'seeTheDifference') || []).sort((a, b) => a.order - b.order).map((m) => (
              <div key={m._id} className="media-item-card">
                <img src={resolveUploadOrAbsoluteUrl(m.url)} alt="" className="media-item-preview" />
                <span className="media-item-name">{m.name?.trim() ? m.name : `Slide ${m.order + 1}`}</span>
                <button type="button" className="secondary-button media-delete-button" onClick={() => deleteMediaItem(m._id)}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
  )
}
