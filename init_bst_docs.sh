cd ./bst_docs
#git clone git@bstcd.stuffs.biz:docs/c1200_struct_docs.git

# cd c1200_struct_docs
repo init -u http://bstcd.stuffs.biz/docs/c1200_struct_docs.git --repo-url=http://bstcd.stuffs.biz/bsp/thirdparty/git_repo --no-repo-verify --repo-rev=stable

repo sync

cd ./docs

# cp ../index_* ./