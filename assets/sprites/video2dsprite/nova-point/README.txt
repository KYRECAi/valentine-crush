Video2dsprite output (Grok Build pipeline)
==========================================
base/           base still on #FF00FF
video/          imagine_image_to_video clip
frames-raw/     decoded frames
frames-clean/   chroma-keyed RGBA frames
sprite/         sampled normalized sprites + strips/grids/GIFs
pipeline-meta.json

This folder was produced for Grok Build (imagine_text_to_image + imagine_image_to_video).
Codex/other agents cannot run the video step; they can still re-sample
existing frames with: python video2dsprite.py sample --clean-dir ...

{
  "skill": "video2dsprite",
  "platform": "Grok Build (imagine_image_to_video required for generation step)",
  "name": "nova-point",
  "video": "/workspace/assets/sprites/video2dsprite/nova-point/video/nova-point-8fps.mp4",
  "out_dir": "/workspace/assets/sprites/video2dsprite/nova-point",
  "raw_frames": 48,
  "chroma_dist": 55.0,
  "cell_size": 256,
  "body_height": 100,
  "foot_y": 118,
  "anchor": "center",
  "total_clean": 48,
  "sets": [
    {
      "count": 12,
      "tag": "x12",
      "sprites": [
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_01.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_02.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_03.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_04.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_05.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_06.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_07.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_08.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_09.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_10.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_11.png",
        "/workspace/assets/sprites/video2dsprite/nova-point/sprite/x12/sprite_12.png"
      ],
      "strip": "/workspace/assets/sprites/video2dsprite/nova-point/sprite/run-strip-12.png",
      "grid": "/workspace/assets/sprites/video2dsprite/nova-point/sprite/run-grid-12.png",
      "gif": "/workspace/assets/sprites/video2dsprite/nova-point/sprite/run-preview-12.gif",
      "gif_ms": 60,
      "indices": [
        0,
        4,
        9,
        13,
        17,
        21,
        26,
        30,
        34,
        38,
        43,
        47
      ]
    }
  ]
}
