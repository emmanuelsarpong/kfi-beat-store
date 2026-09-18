import { Link } from "react-router-dom";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-black/[0.06] lg:mt-24">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 lg:hidden">
        <p className="font-display tracking-[0.22em] text-sm">KFI</p>
        <p className="mt-5 max-w-[16rem] text-[15px] leading-6 text-[#6F6F69]">
          Premium production for artists
          <br />
          building records worth replaying.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-x-12 text-sm">
          <div>
            <p className="kfi-kicker">Beats</p>
            <div className="mt-3 flex flex-col gap-2.5">
              <a href="/#beats" className="text-[#6F6F69]">
                Latest
              </a>
              <Link to="/store" className="text-[#6F6F69]">
                Browse
              </Link>
              <Link to="/favorites" className="text-[#6F6F69]">
                Favorites
              </Link>
            </div>
          </div>
          <div>
            <p className="kfi-kicker">Info</p>
            <div className="mt-3 flex flex-col gap-2.5">
              <Link to="/about" className="text-[#6F6F69]">
                About
              </Link>
              <a href="/#contact" className="text-[#6F6F69]">
                Contact
              </a>
              <Link to="/licensing" className="text-[#6F6F69]">
                Licensing
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-12 text-sm">
          <a
            href="https://instagram.com/thisiskfi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#6F6F69]"
          >
            Instagram
          </a>
          <a href="mailto:info.kfimusic@gmail.com" className="text-[#6F6F69]">
            Email
          </a>
        </div>

        <div className="mt-10 text-[12px] leading-5 text-[#999991]">
          <p>© {year} KFI</p>
          <p className="mt-1">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            {" · "}
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 hidden py-20 lg:block">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-5 max-w-sm">
            <p className="font-display tracking-[0.22em] text-sm">KFI</p>
            <p className="mt-6 text-[15px] leading-7 text-[#6F6F69]">
              Premium production for
              <br />
              artists building records
              <br />
              worth replaying.
            </p>
          </div>

          <div className="col-span-3">
            <p className="kfi-kicker">Beats</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <a href="/#beats" className="text-[#6F6F69] hover:text-foreground">
                Latest
              </a>
              <Link to="/store" className="text-[#6F6F69] hover:text-foreground">
                Browse
              </Link>
              <Link to="/favorites" className="text-[#6F6F69] hover:text-foreground">
                Favorites
              </Link>
            </div>
          </div>

          <div className="col-span-4">
            <p className="kfi-kicker">Info</p>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link to="/about" className="text-[#6F6F69] hover:text-foreground">
                About
              </Link>
              <a href="/#contact" className="text-[#6F6F69] hover:text-foreground">
                Contact
              </a>
              <Link to="/licensing" className="text-[#6F6F69] hover:text-foreground">
                Licensing
              </Link>
              <a
                href="https://instagram.com/thisiskfi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#6F6F69] hover:text-foreground"
              >
                Instagram
              </a>
              <a
                href="mailto:info.kfimusic@gmail.com"
                className="text-[#6F6F69] hover:text-foreground"
              >
                Email
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex items-center justify-between text-[12px] text-[#999991]">
          <span>© {year} KFI</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
