#!/bin/bash
mkdir usr
chmod -R 777 usr

echo '#!/bin/bash'>./wd
echo 'save_path=$PWD'>>./wd
echo 'cd '$PWD >>./wd
echo 'bash ./wdd $*'>>./wd
echo 'cd $save_path'>>./wd

sudo cp ./wd /usr/bin/wd
chmod +x /usr/bin/wd

echo 'Setup Finished! '
