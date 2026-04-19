#!/usr/bin/env perl

use strict;
use warnings;

sub usage {
  my $message = shift;

  my $usage = <<~'END_USAGE';
    Usage: inject.sh text_filename [tag replacement_filename]...

    File text_filename is edited in place. Content of replacement_filename
    is appended after the first occurrence of the corresponding tag text.
  END_USAGE
  die "  Error: $message.\n\n$usage";
}

sub slurp {
  my $filename = shift;
  open(my $inf, '<', $filename) or usage("Could not open '$filename' for input: $!");
  my $content = do { local $/ = undef; <$inf> };
  close($inf);
  $content;
}

sub main {
  usage('Expected odd number of args') if @ARGV % 2 != 1;
  my $textfile = shift @ARGV; 
  my $text = slurp $textfile;
  while (@ARGV) {
    my $tag = shift @ARGV;
    my $injectfile = shift @ARGV;
    my $injection = slurp $injectfile;
    $text =~ s/$tag/$tag$injection/; 
  }
  open(my $outf, '>', $textfile) or usage("Could not open '$textfile' for output: $!");
  print $outf $text;
  close($outf);
}

main;
