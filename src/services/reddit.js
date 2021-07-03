export async function getTopWallpaper() {
  const response = await fetch("https://www.reddit.com/r/wallpaper/top/.json?count=2?sort=new")
  const data = await(response.json());
  return data;
}

