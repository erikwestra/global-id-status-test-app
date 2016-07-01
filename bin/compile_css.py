#!/usr/bin/python

#############################################################################
#
# compile_css.py
#
# This program "compiles" the various state-specific CSS files into a single
# combined CSS file that can be used by the generated application.
#
# We scan through the various sub-directories in the www/app/states directory,
# looking for files of the form "XYZ.css".  We then scan that file for CSS
# definitions, and alter then so that each CSS definition has ".XYZ " added to
# the front (where "XYZ" is the base name for the CSS file the definition came
# from).  This has the effect of limiting the application of that CSS rule to
# only work for elements within a container which has that class name.   The
# resulting CSS definitions are then written to the "state_styles.css" file in
# the "www/assets/css" directory.
#
#############################################################################

import os
import os.path

#############################################################################

def main():
    """ Our main program.
    """
    cur_dir    = os.path.dirname(os.path.abspath(__file__))
    root_dir   = os.path.abspath(os.path.join(cur_dir, ".."))
    states_dir = os.path.join(root_dir, "www/app/states")
    dst_file   = file(os.path.join(root_dir,
                                   "www/assets/css//state_styles.css"), "w")

    dst_file.write("/*******************************************************" +
                   "*********************\n")
    dst_file.write(" *\n")
    dst_file.write(" * state_styles.css\n")
    dst_file.write(" *\n")
    dst_file.write(" * WARNING! Do not edit this CSS file.  It is created " +
                   "automatically from the\n")
    dst_file.write(" *          individual .css files in our state " +
                   "directories.  Any changes you\n")
    dst_file.write(" *          make to this file will be overwritten.\n")
    dst_file.write(" *\n")
    dst_file.write(" * To recompile this file, run the bin/compile_css.py " +
                   "script\n")
    dst_file.write(" *\n")
    dst_file.write(" *******************************************************" +
                   "********************/\n")
    dst_file.write("\n")

    for dir_name in os.listdir(states_dir):
        if dir_name.startswith("."): continue
        state_dir = os.path.join(states_dir, dir_name)
        if not os.path.isdir(state_dir):
            continue

        # We have a state directory.  Look for any CSS files within it.

        for file_name in os.listdir(state_dir):
            if file_name.startswith(".") or not file_name.endswith(".css"):
                continue

            # We have a CSS file.  Process it.

            file_path    = os.path.join(state_dir, file_name)
            css_selector = os.path.splitext(file_name)[0]

            dst_file.write("/* " + css_selector + ".css */\n")
            dst_file.write("\n")

            in_definition = False
            src_file = file(file_path, "r")
            for line in src_file:
                line = line.rstrip()
                if in_definition:
                    dst_file.write(line + "\n")
                    if line.lstrip().startswith("}"):
                        in_definition = False
                        dst_file.write("\n")
                else:
                    if line.endswith("{"):
                        dst_file.write("."+css_selector+"-state "+line+"\n")
                        in_definition = True

#############################################################################

if __name__ == "__main__":
    main()

