const Footer = () => {
  const currYear = new Date().getFullYear();

  return (
    <h3 className="text-center mt-12">
      &copy; {currYear} Jin All Rights Reserved
    </h3>
  );
};
export default Footer;
