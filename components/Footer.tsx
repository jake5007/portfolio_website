const Footer = () => {
  const currYear = new Date().getFullYear();

  return (
    <footer className="text-center mt-12">
      &copy; {currYear} Jin All Rights Reserved
    </footer>
  );
};
export default Footer;
