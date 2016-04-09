file="$1"
unique="$2"
category="$3"
compression="$4"

echo "$file"
echo "$unique"

mkdir /mnt/resource/$unique
ffmpeg -i $file -vf fps=24 /mnt/resource/$unique/pic%d.jpg 
ffmpeg -i $file -vn /mnt/resource/$unique/audio.mp3
for line in $(find /mnt/resource/$unique -iname 'pic*.jpg'); do sem -j+0 node --use_strict /home/tessera/tessera/decomposite_image.js $line --compress $compression --palette /home/tessera/tessera/ref.png --images /mnt/resource/source_images/$category --output $line.jpg; done; sem --wait
ffmpeg -framerate 24 -i /mnt/resource/$unique/pic%d.jpg.jpg -i /mnt/resource/$unique/audio.mp3 -c:v libx264 -r 24 -pix_fmt yuv420p -strict -2 /home/tessera/site/videos/inprogress_$unique.mp4
mv /home/tessera/site/videos/inprogress_$unique.mp4 /home/tessera/site/videos/$unique.mp4
